
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
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
  Zap,
  LayoutDashboard
} from 'lucide-react';
import { Card, Button, Badge, TourTooltip } from '../components/UI';
import { motion, AnimatePresence } from 'framer-motion';

const DashboardHome: React.FC = () => {
  const [activeTourStep, setActiveTourStep] = useState<number | null>(null);

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
        {[
          { label: 'Today\'s Bookings', value: '12', icon: <Calendar className="text-blue-500" />, trend: '+18%', pos: true },
          { label: 'Active Services', value: '8', icon: <Briefcase className="text-purple-500" />, trend: 'Stable', pos: null },
          { label: 'New Contacts', value: '45', icon: <Users className="text-indigo-500" />, trend: '+12%', pos: true },
          { label: 'Revenue (MTD)', value: '$12,450', icon: <TrendingUp className="text-green-500" />, trend: '+24%', pos: true },
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
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Workspaces</h2>
            <Link to="/dashboard/workspaces" className="text-blue-500 text-xs font-bold hover:underline flex items-center gap-1 uppercase tracking-wider">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[
              { name: 'City Dental Clinic', progress: 100, status: 'Active', bookings: 84 },
              { name: 'Elite Spa & Wellness', progress: 40, status: 'In Setup', bookings: 0 },
            ].map((workspace, i) => (
              <Card key={i} className="p-6 group cursor-pointer border-l-4 border-l-blue-500">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h4 className="font-bold text-gray-900">{workspace.name}</h4>
                    <Badge variant={workspace.status === 'Active' ? 'success' : 'warning'} className="mt-1.5">
                      {workspace.status}
                    </Badge>
                  </div>
                  <div className="w-9 h-9 bg-gray-50 rounded-lg flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all">
                    <ExternalLink size={16} />
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                    <span>Operations Score</span>
                    <span className="text-blue-500">{workspace.progress}%</span>
                  </div>
                  <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                      style={{ width: `${workspace.progress}%` }}
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div className="mt-8">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Operations Feed</h2>
            <Card className="divide-y divide-gray-100">
              {[
                { type: 'Booking', message: 'New appointment confirmed: James Wilson', time: '2 mins ago' },
                { type: 'Service', message: 'Teeth Whitening price updated in HQ', time: '1 hour ago' },
                { type: 'Integration', message: 'Stripe webhook successfully received', time: '3 hours ago' },
              ].map((log, i) => (
                <div key={i} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                    <div>
                      <p className="text-sm text-gray-700 font-medium">{log.message}</p>
                      <p className="text-xs text-gray-400">{log.time}</p>
                    </div>
                  </div>
                  <button className="text-gray-300 hover:text-gray-600"><MoreVertical size={16} /></button>
                </div>
              ))}
            </Card>
          </div>
        </div>

        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-900">Upcoming</h2>
            <Link to="/dashboard/bookings" className="text-blue-500 text-[10px] font-bold uppercase tracking-widest">Full View</Link>
          </div>
          <Card className="divide-y divide-gray-100">
            {[
              { time: '10:00 AM', name: 'James Wilson', service: 'Standard Consultation', duration: '30m' },
              { time: '11:30 AM', name: 'Sarah Miller', service: 'Teeth Cleaning', duration: '45m' },
              { time: '02:00 PM', name: 'Robert Fox', service: 'Check-up', duration: '15m' },
              { time: '04:15 PM', name: 'Lisa Chen', service: 'Orthodontic Prep', duration: '60m' },
            ].map((booking, i) => (
              <div key={i} className="p-4 hover:bg-gray-50 transition-colors flex items-center gap-4 group">
                <div className="flex flex-col items-center justify-center bg-gray-50 rounded-lg py-1 px-3 w-20 border border-gray-100 group-hover:border-blue-200 transition-colors">
                  <span className="text-[10px] font-bold text-blue-500 uppercase tracking-tighter">Today</span>
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">{booking.time.split(' ')[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900 truncate">{booking.name}</p>
                  <p className="text-[11px] text-gray-400 font-medium truncate">{booking.service}</p>
                </div>
                <Badge variant="info" className="bg-blue-50/50 border-none">{booking.duration}</Badge>
              </div>
            ))}
            <div className="p-4">
              <Button variant="ghost" className="w-full text-blue-500 text-xs font-bold uppercase tracking-widest hover:bg-blue-50">
                View Today's Full Schedule
              </Button>
            </div>
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
