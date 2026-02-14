
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  TrendingUp,
  Calendar,
  Users,
  ArrowRight,
  MoreVertical,
  Briefcase,
  ExternalLink,
  HelpCircle,
  LayoutDashboard,
  MessageSquare
} from 'lucide-react';
import { Card, Button, Badge, TourTooltip, Skeleton } from '../components/UI';
import { motion, AnimatePresence } from 'framer-motion';
import { authService, bookingService, workspaceService, formService } from '../lib/services/api';
import { toast } from 'react-hot-toast';

const DashboardHome: React.FC = () => {
  const navigate = useNavigate();
  const [activeTourStep, setActiveTourStep] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionData, setSessionData] = useState<any>(null);
  const [stats, setStats] = useState({
    todayBookings: 0,
    activeServices: 0,
    newContacts: 0,
    revenue: '$0',
  });
  const [recentBookings, setRecentBookings] = useState<any[]>([]);
  const [inquiries, setInquiries] = useState<any[]>([]);

  const tourSteps = [
    {
      targetId: "sidebar-logo",
      title: "Welcome to CareOps",
      description: "This is your central command center. Click the logo anytime to return to this overview.",
      position: 'right' as const
    },
    {
      targetId: "workspace-selector",
      title: "Switch Workspaces",
      description: "Easily jump between different clinics or salon locations using this quick switcher.",
      position: 'bottom' as const
    },
    {
      targetId: "create-workspace-btn",
      title: "Scale your Business",
      description: "Opening a new location? Create a fresh workspace with separate staff and services in seconds.",
      position: 'bottom' as const
    },
    {
      targetId: "nav-bookings",
      title: "Manage Appointments",
      description: "The heart of your operations. Track all incoming bookings and schedule shifts from this tab.",
      position: 'right' as const
    },
    {
      targetId: "notifications-bell",
      title: "Stay Informed",
      description: "Get real-time alerts for new bookings, staff updates, and operational performance.",
      position: 'bottom' as const
    }
  ];

  const handleStartTour = () => {
    setActiveTourStep(0);
  };

  const handleNextTourStep = () => {
    if (activeTourStep !== null) {
      if (activeTourStep < tourSteps.length - 1) {
        setActiveTourStep(activeTourStep + 1);
      } else {
        setActiveTourStep(null);
      }
    }
  };

  const handleSkipTour = () => {
    setActiveTourStep(null);
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const session = await authService.getSession();
        setSessionData(session);

        // Get stats from first workspace if available
        if (session.workspaces && session.workspaces.length > 0) {
          const firstWorkspace = session.workspaces[0];

          // Get bookings for today's count
          try {
            const bookings = await bookingService.getWorkspaceBookings(firstWorkspace.id);
            const today = new Date().toISOString().split('T')[0];
            const todayBookings = bookings.filter(b => b.date === today);
            setStats(prev => ({ ...prev, todayBookings: todayBookings.length }));
            setRecentBookings(bookings.slice(0, 4));
          } catch (err) {
            console.error('Failed to load bookings:', err);
          }

          // Get service types count
          try {
            const serviceTypes = await bookingService.getServiceTypes(firstWorkspace.id);
            setStats(prev => ({ ...prev, activeServices: serviceTypes.filter(st => st.isActive).length }));
          } catch (err) {
            console.error('Failed to load service types:', err);
          }

          // Get inquiries
          try {
            const submissions = await formService.getWorkspaceSubmissions(firstWorkspace.id);
            setInquiries(submissions.slice(0, 5));
          } catch (err) {
            console.error('Failed to load inquiries:', err);
          }
        }
      } catch (error: any) {
        console.error('Failed to load dashboard data:', error);
        toast.error(error.message || 'Failed to load dashboard data');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const handleWorkspaceClick = (workspaceId: string) => {
    navigate(`/dashboard/workspaces/`);
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Overview</h1>
          <p className="text-gray-500 mt-1 text-sm">Monitor your operational health and customer engagement.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleStartTour} className="flex items-center gap-2">
            <HelpCircle size={16} />
            <span>Start Walkthrough</span>
          </Button>
          <Link to="/dashboard/workspaces">
            <Button id="create-workspace-btn" className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20">
              <Plus size={16} />
              <span>Create Workspace</span>
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {isLoading ? (
          [1, 2, 3, 4].map(i => (
            <Card key={i} className="p-5">
              <Skeleton className="h-20 w-full" />
            </Card>
          ))
        ) : (
          [
            { label: 'Today\'s Bookings', value: stats.todayBookings.toString(), icon: <Calendar className="text-blue-500" />, trend: null, pos: null },
            { label: 'Active Services', value: stats.activeServices.toString(), icon: <Briefcase className="text-purple-500" />, trend: null, pos: null },
            { label: 'New Contacts', value: stats.newContacts.toString(), icon: <Users className="text-indigo-500" />, trend: null, pos: null },
            { label: 'Revenue (MTD)', value: stats.revenue, icon: <TrendingUp className="text-green-500" />, trend: null, pos: null },
          ].map((stat, i) => (
            <Card key={i} className="p-5 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-gray-100">{stat.icon}</div>
                {stat.pos !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${stat.pos ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {stat.trend}
                  </span>
                )}
              </div>
              <div className="mt-4">
                <p className="text-gray-500 text-[11px] font-bold uppercase tracking-wider">{stat.label}</p>
                <h3 className="text-2xl font-bold text-gray-900 mt-0.5">{stat.value}</h3>
              </div>
            </Card>
          ))
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Workspaces</h2>
            <Link to="/dashboard/workspaces" className="text-blue-500 text-xs font-bold hover:underline flex items-center gap-1 uppercase tracking-wider">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {[1, 2].map(i => (
                <Card key={i} className="p-6">
                  <Skeleton className="h-32 w-full" />
                </Card>
              ))}
            </div>
          ) : sessionData?.workspaces && sessionData.workspaces.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {sessionData.workspaces.slice(0, 2).map((workspace: any) => {
                const progress = workspace.setupCompleted ? 100 : 50;
                const status = workspace.isActive ? 'Active' : 'In Setup';
                return (
                  <Card key={workspace.id} className="p-6 group cursor-pointer border-l-4 border-l-blue-500">
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h4 className="font-bold text-gray-900">{workspace.businessName}</h4>
                        <Badge variant={status === 'Active' ? 'success' : 'warning'} className="mt-1.5">
                          {status}
                        </Badge>
                      </div>
                      <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ExternalLink onClick={() => handleWorkspaceClick(workspace.id)} size={16} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <span>Operations Score</span>
                        <span className="text-blue-500">{progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <p className="text-gray-500">No workspaces yet. Create your first workspace to get started.</p>
            </Card>
          )}

          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Operations Feed</h2>
            <Card className="divide-y divide-gray-100">
              {isLoading ? (
                <div className="p-6 space-y-4">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : recentBookings.length > 0 ? (
                recentBookings.slice(0, 3).map((booking) => {
                  const bookingDate = new Date(booking.date);
                  const timeAgo = bookingDate < new Date() ? 'Recently' : 'Upcoming';
                  return (
                    <div key={booking.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 rounded-full bg-blue-400" />
                        <div>
                          <p className="text-sm text-gray-700 font-medium">
                            Booking: {booking.contact.firstName} {booking.contact.lastName} - {booking.serviceType.name}
                          </p>
                          <p className="text-xs text-gray-400">{timeAgo}</p>
                        </div>
                      </div>
                      <button className="text-gray-300 hover:text-gray-600"><MoreVertical size={16} /></button>
                    </div>
                  );
                })
              ) : (
                <div className="px-6 py-8 text-center text-gray-500">
                  <p>No recent activity</p>
                </div>
              )}
            </Card>

            <div className="mt-8">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Leads & Conversations</h2>
              <Card className="divide-y divide-gray-100">
                {isLoading ? (
                  <div className="p-6 space-y-4">
                    {[1, 2].map(i => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : inquiries.length > 0 ? (
                  inquiries.map((inq, i) => (
                    <div key={inq.id || i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors group cursor-pointer">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                          <MessageSquare size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">
                            {inq.contact.firstName} {inq.contact.lastName}
                            <span className="font-normal text-gray-500 ml-1">via {inq.formName}</span>
                          </p>
                          <p className="text-xs text-gray-400 mt-0.5 max-w-md truncate">
                            {inq.contact.email || inq.contact.phone || 'New inquiry received'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                          {new Date(inq.submittedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="px-6 py-8 text-center text-gray-500">
                    <p>No new inquiries</p>
                  </div>
                )}
              </Card>
            </div>
          </div>

        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Upcoming</h2>
            <Link to="/dashboard/bookings" className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">Full View</Link>
          </div>
          <Card className="divide-y divide-gray-100">
            {isLoading ? (
              <div className="p-4 space-y-4">
                {[1, 2, 3, 4].map(i => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : recentBookings.length > 0 ? (
              <>
                {recentBookings.map((booking) => {
                  const bookingTime = new Date(`${booking.date}T${booking.time}`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                  const isToday = booking.date === new Date().toISOString().split('T')[0];
                  return (
                    <div key={booking.id} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 group">
                      <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-1 px-3 w-20 border border-gray-100 group-hover:border-blue-200 transition-colors">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">{isToday ? 'Today' : 'Upcoming'}</span>
                        <span className="text-xs font-bold text-gray-900 whitespace-nowrap">{bookingTime}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-gray-900 truncate">{booking.contact.firstName} {booking.contact.lastName}</p>
                        <p className="text-[11px] text-gray-400 font-medium truncate">{booking.serviceType.name}</p>
                      </div>
                      <Badge variant="info" className="bg-blue-50/50 border-none">{booking.serviceType.duration}m</Badge>
                    </div>
                  );
                })}
                <div className="p-4">
                  <Link to="/dashboard/bookings">
                    <Button variant="ghost" className="w-full text-blue-500 text-xs font-bold uppercase tracking-widest hover:bg-blue-50">
                      View Today's Full Schedule
                    </Button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="p-8 text-center text-gray-500">
                <p>No upcoming bookings</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Pop-up Guide Walkthrough */}
      <AnimatePresence>
        {activeTourStep !== null && (
          <TourTooltip
            targetId={tourSteps[activeTourStep].targetId}
            title={tourSteps[activeTourStep].title}
            description={tourSteps[activeTourStep].description}
            currentStep={activeTourStep}
            totalSteps={tourSteps.length}
            onNext={handleNextTourStep}
            onSkip={handleSkipTour}
            position={tourSteps[activeTourStep].position}
          />
        )}
      </AnimatePresence>

      {/* Tour Backdrop */}
      {activeTourStep !== null && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] bg-slate-900/10 pointer-events-none"
        />
      )}
    </div>
  );
};

export default DashboardHome;
