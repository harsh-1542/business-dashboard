
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock,
  MapPin,
  ChevronRight,
  Calendar as CalendarIcon,
  CheckCircle,
  ArrowLeft,
  ShieldCheck,
  Star,
  Globe
} from 'lucide-react';
import { Card, Button, Input, Skeleton } from '../components/UI';
import { toast } from 'react-hot-toast';
import { bookingService } from '../lib/services/api';
import { ServiceType, AvailabilitySchedule } from '../lib/services/api';
import confetti from 'canvas-confetti';

const PublicBooking: React.FC = () => {
  const { workspaceId } = useParams<{ workspaceId: string }>();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [workspace, setWorkspace] = useState<any>(null);
  const [services, setServices] = useState<ServiceType[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySchedule[]>([]);
  const [selectedService, setSelectedService] = useState<ServiceType | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    notes: '',
  });


  // Date state
  const [currentDate, setCurrentDate] = useState(new Date());

  // Format date for display and value
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (year: number, month: number) => {
    return new Date(year, month, 1).getDay();
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + offset, 1);
    setCurrentDate(newDate);
  };

  const isDateDisabled = (year: number, month: number, day: number) => {
    const checkDate = new Date(year, month, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const handleDateSelect = (year: number, month: number, day: number) => {
    // Manually format to YYYY-MM-DD to avoid timezone shifting issues with toISOString()
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    setSelectedDate(`${year}-${m}-${d}`);
  };

  // Google Calendar URL generator
  const getGoogleCalendarUrl = () => {
    if (!selectedService || !selectedDate || !selectedTime) return '#';

    // Parse start datetime
    const [hours, minutesPart] = selectedTime.split(/[: ]/); // "9:30 AM" -> ["9", "30", "AM"]
    const ampm = selectedTime.includes('PM') ? 'PM' : 'AM';
    let hour = parseInt(hours);
    if (ampm === 'PM' && hour !== 12) hour += 12;
    if (ampm === 'AM' && hour === 12) hour = 0;

    const startDate = new Date(selectedDate);
    startDate.setHours(hour, parseInt(minutesPart), 0);

    // Calculate end datetime
    const endDate = new Date(startDate.getTime() + (selectedService.durationMinutes * 60000));

    // Format to YYYYMMDDTHHMMSSZ
    const format = (d: Date) => d.toISOString().replace(/-|:|\.\d\d\d/g, "");

    const params = new URLSearchParams({
      action: 'TEMPLATE',
      text: selectedService.name,
      dates: `${format(startDate)}/${format(endDate)}`,
      details: `Appointment with ${workspace?.businessName}\n\nService: ${selectedService.name}\nNotes: ${formData.notes || 'None'}`,
      location: workspace?.address || '',
    });

    return `https://calendar.google.com/calendar/render?${params.toString()}`;
  };

  useEffect(() => {
    if (workspaceId) {
      loadBookingPageData();
    }
  }, [workspaceId]);

  const loadBookingPageData = async () => {
    if (!workspaceId) return;
    try {
      setIsLoading(true);
      const data = await bookingService.getPublicBookingPage(workspaceId);
      setWorkspace(data.workspace);
      setServices(data.serviceTypes);
      setAvailability(data.availability);
    } catch (error: any) {
      console.error('Failed to load booking page:', error);
      toast.error(error.message || 'Failed to load booking page');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !selectedService || !selectedDate || !selectedTime) {
      toast.error('Please complete all required fields');
      return;
    }

    try {
      setIsSubmitting(true);

      // Convert to 24-hour format (HH:MM:SS) for backend
      const [timePart, modifier] = selectedTime.split(' ');
      let [hours, minutes] = timePart.split(':');
      let hoursInt = parseInt(hours, 10);

      if (modifier === 'PM' && hoursInt < 12) hoursInt += 12;
      if (modifier === 'AM' && hoursInt === 12) hoursInt = 0;

      const bookingTime24 = `${hoursInt.toString().padStart(2, '0')}:${minutes}:00`;

      await bookingService.createPublicBooking({
        workspaceId,
        serviceTypeId: selectedService.id,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        bookingDate: selectedDate, // Send YYYY-MM-DD
        bookingTime: bookingTime24,
        notes: formData.notes || undefined,
      });
      setIsSubmitting(false);
      setStep(4);
      toast.success('Appointment booked!');

      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
      });
    } catch (error: any) {
      setIsSubmitting(false);
      toast.error(error.message || 'Failed to book appointment');
    }
  };

  const nextStep = () => {
    if (step === 1 && !selectedService) return;
    if (step === 2 && (!selectedDate || !selectedTime)) return;
    setStep(prev => prev + 1);
  };
  const prevStep = () => setStep(prev => prev - 1);

  const getAvailableTimeSlots = () => {
    if (!selectedDate || availability.length === 0) return [];

    // selectedDate is now YYYY-MM-DD string from standard input or our calendar
    // Create date strictly from YYYY-MM-DD parts to avoid timezone issues
    const [y, m, d] = selectedDate.split('-').map(Number);
    const date = new Date(y, m - 1, d);

    const dayOfWeek = date.getDay(); // 0-6
    const daySchedule = availability.find(a => a.dayOfWeek === dayOfWeek);
    if (!daySchedule) return [];

    // Generate time slots between startTime and endTime
    const slots: string[] = [];
    const [startHour, startMin] = daySchedule.startTime.split(':').map(Number);
    const [endHour, endMin] = daySchedule.endTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const duration = selectedService?.durationMinutes || 30;

    for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += 30) {
      const hour = Math.floor(minutes / 60);
      const min = minutes % 60;
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour % 12 || 12;
      const timeString = `${displayHour}:${min.toString().padStart(2, '0')} ${ampm}`;
      slots.push(timeString);
    }

    return slots;
  };

  // Helper to get array of days for calendar
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);

    const days = [];
    // Add empty slots for days before start of month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Add days of month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const monthNames = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Branding Header */}
      <div className="bg-white border-b border-gray-100 py-6 px-4 md:px-8 mb-12 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="text-blue-400" size={32} />
            </div>
            {isLoading ? (
              <div className="text-center md:text-left">
                <Skeleton className="h-8 w-48 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            ) : workspace ? (
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{workspace.businessName}</h1>
                <div className="flex items-center justify-center md:justify-start gap-3 mt-1 text-gray-500 text-sm">
                  {workspace.address && (
                    <>
                      <span className="flex items-center gap-1"><MapPin size={14} className="text-blue-500" /> {workspace.address}</span>
                      <span className="hidden sm:inline w-1 h-1 bg-gray-300 rounded-full" />
                    </>
                  )}
                  <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" /> 4.9</span>
                </div>
              </div>
            ) : (
              <div className="text-center md:text-left">
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Booking Page</h1>
              </div>
            )}
          </div>
          <div className="flex gap-4">
            <Button variant="outline" className="text-xs h-9 uppercase tracking-wider font-bold">Contact Office</Button>
            <Button variant="outline" className="text-xs h-9 uppercase tracking-wider font-bold">Patient Portal</Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4">
        {/* Mobile View Summary Toggle could go here */}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          <div className="lg:col-span-8">
            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-bold text-gray-900">1. Select a Service</h2>
                    <span className="text-xs font-bold text-gray-400 uppercase">Step 1 of 3</span>
                  </div>
                  {isLoading ? (
                    <div className="space-y-4">
                      {[1, 2, 3].map(i => (
                        <Skeleton key={i} className="h-32 w-full" />
                      ))}
                    </div>
                  ) : services.length === 0 ? (
                    <Card className="p-12 text-center">
                      <p className="text-gray-500">No services available for booking at this time.</p>
                    </Card>
                  ) : (
                    <div className="grid grid-cols-1 gap-4">
                      {services.map((service) => (
                        <Card
                          key={service.id}
                          className={`p-6 cursor-pointer border-2 transition-all group ${selectedService?.id === service.id ? 'border-blue-500 ring-4 ring-blue-50' : 'border-transparent hover:border-gray-200'}`}
                          onClick={() => {
                            setSelectedService(service);
                            nextStep();
                          }}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 pr-4">
                              <h3 className="font-bold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">{service.name}</h3>
                              {service.description && (
                                <p className="text-gray-500 text-sm mt-1 leading-relaxed line-clamp-2">{service.description}</p>
                              )}
                              <div className="flex items-center gap-4 mt-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500" /> {service.durationMinutes} min</span>
                                {service.location && (
                                  <span className="flex items-center gap-1.5"><Globe size={14} className="text-purple-500" /> {service.location}</span>
                                )}
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end">
                              <div className="mt-4 p-2 rounded-full bg-gray-50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <ChevronRight size={20} />
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}

              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4">
                    <button onClick={prevStep} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">2. Select Date & Time</h2>
                      <p className="text-gray-500 text-sm">Pick a slot that fits your schedule.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                      <div className="flex items-center justify-between mb-6">
                        <span className="font-bold text-gray-900">
                          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => changeMonth(-1)}
                            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"
                            // Prevent going back past current month if it's the current month
                            disabled={currentDate.getMonth() === new Date().getMonth() && currentDate.getFullYear() === new Date().getFullYear()}
                          >
                            <ChevronRight className="rotate-180" size={18} />
                          </button>
                          <button
                            onClick={() => changeMonth(1)}
                            className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center mb-4">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <span key={day} className="text-[10px] font-bold text-gray-400 uppercase">{day}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {getCalendarDays().map((day, i) => {
                          if (day === null) return <div key={`empty-${i}`} />;

                          const year = currentDate.getFullYear();
                          const month = currentDate.getMonth();
                          // Manual formatting to match stored selectedDate format and avoid timezone shifts
                          const m = (month + 1).toString().padStart(2, '0');
                          const d = day.toString().padStart(2, '0');
                          const dateString = `${year}-${m}-${d}`;
                          const isDisabled = isDateDisabled(year, month, day);
                          const isSelected = selectedDate === dateString;
                          const isToday = !isDisabled && new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

                          return (
                            <button
                              key={i}
                              disabled={isDisabled}
                              onClick={() => handleDateSelect(year, month, day)}
                              className={`h-9 rounded-lg text-xs font-bold transition-all ${isSelected
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                                : isDisabled
                                  ? 'text-gray-200 cursor-not-allowed'
                                  : isToday
                                    ? 'text-blue-600 bg-blue-50 border border-blue-100'
                                    : 'hover:bg-blue-50 text-gray-700'
                                }`}
                            >
                              {day}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Available Times</h3>
                        {selectedDate && <span className="text-[10px] font-bold text-blue-500">{new Date(selectedDate).toLocaleDateString()}</span>}
                      </div>
                      {selectedDate ? (
                        <div className="grid grid-cols-2 gap-2.5">
                          {getAvailableTimeSlots().length === 0 ? (
                            <div className="col-span-2 text-center py-8 text-gray-500">
                              <p>No available time slots for this date.</p>
                              <p className="text-xs mt-2">Please select another date.</p>
                            </div>
                          ) : (
                            getAvailableTimeSlots().map((time) => (
                              <button
                                key={time}
                                onClick={() => {
                                  setSelectedTime(time);
                                  nextStep();
                                }}
                                className={`py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all ${selectedTime === time
                                  ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                  : 'border-transparent bg-white shadow-sm hover:border-blue-200 text-gray-700'
                                  }`}
                              >
                                {time}
                              </button>
                            ))
                          )}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-400">
                          <CalendarIcon size={32} className="mx-auto mb-2 text-gray-200" />
                          <p>Please select a date first</p>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="space-y-8"
                >
                  <div className="flex items-center gap-4">
                    <button onClick={prevStep} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                      <ArrowLeft size={20} />
                    </button>
                    <div>
                      <h2 className="text-xl font-bold text-gray-900">3. Contact Information</h2>
                      <p className="text-gray-500 text-sm">We'll send your confirmation details here.</p>
                    </div>
                  </div>

                  <Card className="p-8 border-none shadow-xl shadow-slate-200/50">
                    <form onSubmit={handleBookingSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">First Name</label>
                          <Input
                            required
                            value={formData.firstName}
                            onChange={e => setFormData({ ...formData, firstName: e.target.value })}
                            placeholder="e.g. John"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Last Name</label>
                          <Input
                            required
                            value={formData.lastName}
                            onChange={e => setFormData({ ...formData, lastName: e.target.value })}
                            placeholder="e.g. Doe"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                          <Input
                            type="email"
                            value={formData.email}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                            placeholder="john@example.com"
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                          <Input
                            type="tel"
                            value={formData.phone}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="+1 (555) 000-0000"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Notes (Optional)</label>
                        <textarea
                          rows={4}
                          value={formData.notes}
                          onChange={e => setFormData({ ...formData, notes: e.target.value })}
                          className="w-full rounded-lg border border-gray-200 p-4 text-sm focus:ring-2 focus:ring-blue-100 focus:border-blue-500 focus:outline-none transition-all"
                          placeholder="Any special requests or information for the clinic?"
                        />
                      </div>

                      <div className="pt-6 border-t border-gray-100">
                        <Button
                          type="submit"
                          disabled={isSubmitting}
                          className="w-full h-14 text-base font-bold bg-slate-900 hover:bg-slate-800 shadow-xl shadow-slate-900/20"
                        >
                          {isSubmitting ? 'Securing your appointment...' : 'Complete Booking'}
                        </Button>
                        <p className="text-center text-[10px] text-gray-400 mt-4 leading-relaxed">
                          By clicking "Complete Booking", you agree to the clinic's terms and cancellation policies.
                        </p>
                      </div>
                    </form>
                  </Card>
                </motion.div>
              )}

              {step === 4 && (
                <motion.div
                  key="success"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-center bg-white p-12 rounded-[32px] shadow-2xl border border-blue-50 relative overflow-hidden"
                >
                  <div className="relative z-10">
                    <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner">
                      <CheckCircle size={56} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-4 tracking-tight">Booking Confirmed!</h2>
                    <p className="text-gray-500 max-w-sm mx-auto mb-10 text-lg">We've reserved your slot. A calendar invite has been sent to your email.</p>

                    <div className="max-w-md mx-auto bg-slate-50 rounded-2xl p-8 text-left border border-slate-100 space-y-4 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ref ID:</span>
                        <span className="text-xs font-mono font-bold text-gray-900">#BK-9428-Z</span>
                      </div>
                      <div className="h-px bg-gray-200" />
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Service</span>
                        <span className="text-sm font-bold text-gray-900">{selectedService?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Scheduled for</span>
                        <span className="text-sm font-bold text-gray-900 text-right">{selectedDate}<br />{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Location</span>
                        <span className="text-sm font-bold text-gray-900">{selectedService?.location}</span>
                      </div>
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                      <a
                        href={getGoogleCalendarUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 transform transition-all hover:scale-[1.02] active:scale-[0.98]"
                      >
                        <Button className="w-full h-14 px-8 font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white shadow-xl shadow-blue-200 border-none transition-all">
                          <CalendarIcon size={18} className="stroke-[2.5]" />
                          Add to Google Calendar
                        </Button>
                      </a>
                      <Button onClick={() => setStep(1)} variant="outline" className="h-14 px-8 font-bold text-sm uppercase tracking-wider border-2 border-slate-200 text-slate-500 hover:text-slate-900 hover:border-slate-900 bg-transparent">
                        Back to Services
                      </Button>
                    </div>
                  </div>
                  {/* Decorative background circle */}
                  <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-50 rounded-full blur-3xl opacity-50" />
                  <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-green-50 rounded-full blur-3xl opacity-50" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Sticky Sidebar Summary */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
              <Card className="p-8 border-none shadow-lg shadow-slate-200/50 bg-white">
                <h3 className="font-bold text-sm text-gray-400 uppercase tracking-widest mb-8 border-b border-gray-50 pb-4">Booking Summary</h3>
                <div className="space-y-8">
                  <div className="flex gap-5">
                    <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0 border border-blue-100">
                      <Briefcase size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Selected Service</p>
                      {selectedService ? (
                        <>
                          <p className="font-bold text-gray-900 leading-tight mb-1">{selectedService.name}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-2 font-medium">
                            <Clock size={12} className="text-blue-500" /> {selectedService.durationMinutes} min
                          </p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-300 italic">Please select a service...</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-5">
                    <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600 flex-shrink-0 border border-purple-100">
                      <CalendarIcon size={22} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Appointment Time</p>
                      {selectedDate && selectedTime ? (
                        <>
                          <p className="font-bold text-gray-900 leading-tight mb-1">{new Date(selectedDate).toLocaleDateString()}</p>
                          <p className="text-xs text-purple-600 font-bold uppercase tracking-widest">{selectedTime}</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-300 italic">Please pick a slot...</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-50 flex justify-between items-end">
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Service Duration</p>
                      <p className="text-2xl font-black text-gray-900">{selectedService?.durationMinutes || 0} min</p>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 text-right leading-relaxed">
                      Booking confirmation<br />will be sent via email.
                    </p>
                  </div>
                </div>
              </Card>

              <div className="p-6 bg-slate-900 rounded-[24px] text-white shadow-xl shadow-slate-900/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Office Hours Today</p>
                </div>
                <div className="space-y-3">
                  {[
                    { day: 'Mon - Fri', hours: '9:00 AM - 5:00 PM' },
                    { day: 'Saturday', hours: '10:00 AM - 2:00 PM' },
                    { day: 'Sunday', hours: 'Closed', closed: true },
                  ].map((row, idx) => (
                    <div key={idx} className={`flex justify-between text-xs ${row.closed ? 'opacity-30' : ''}`}>
                      <span className="font-medium text-slate-300">{row.day}</span>
                      <span className="font-bold text-white">{row.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Summary icons
const Briefcase = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
);

export default PublicBooking;
