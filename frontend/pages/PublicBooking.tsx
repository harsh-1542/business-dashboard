
import React, { useState } from 'react';
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
import { Card, Button, Input } from '../components/UI';
import { toast } from 'react-hot-toast';

const SERVICES = [
  { id: '1', name: 'Standard Consultation', duration: '30 min', price: '$50', location: 'Main Clinic', description: 'Comprehensive initial evaluation of your health concerns.' },
  { id: '2', name: 'Full Health Assessment', duration: '60 min', price: '$120', location: 'Main Clinic', description: 'In-depth diagnostic check including lab review and personalized plan.' },
  { id: '3', name: 'Virtual Follow-up', duration: '20 min', price: '$35', location: 'Online/Zoom', description: 'Brief check-in to monitor progress and adjust treatment.' },
];

const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', 
  '01:30 PM', '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM'
];

const PublicBooking: React.FC = () => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsSubmitting(false);
    setStep(4);
    toast.success('Appointment booked!');
  };

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-24">
      {/* Branding Header */}
      <div className="bg-white border-b border-gray-100 py-6 px-4 md:px-8 mb-12 shadow-sm">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-lg">
              <ShieldCheck className="text-blue-400" size={32} />
            </div>
            <div className="text-center md:text-left">
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">City Dental Clinic</h1>
              <div className="flex items-center justify-center md:justify-start gap-3 mt-1 text-gray-500 text-sm">
                 <span className="flex items-center gap-1"><MapPin size={14} className="text-blue-500" /> San Francisco, CA</span>
                 <span className="hidden sm:inline w-1 h-1 bg-gray-300 rounded-full" />
                 <span className="flex items-center gap-1"><Star size={14} className="text-yellow-400 fill-yellow-400" /> 4.9 (240 reviews)</span>
              </div>
            </div>
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
                  <div className="grid grid-cols-1 gap-4">
                    {SERVICES.map((service) => (
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
                            <p className="text-gray-500 text-sm mt-1 leading-relaxed line-clamp-2">{service.description}</p>
                            <div className="flex items-center gap-4 mt-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                              <span className="flex items-center gap-1.5"><Clock size={14} className="text-blue-500" /> {service.duration}</span>
                              <span className="flex items-center gap-1.5"><Globe size={14} className="text-purple-500" /> {service.location}</span>
                            </div>
                          </div>
                          <div className="text-right flex flex-col items-end">
                            <span className="text-xl font-bold text-gray-900">{service.price}</span>
                            <div className="mt-4 p-2 rounded-full bg-gray-50 group-hover:bg-blue-600 group-hover:text-white transition-all">
                              <ChevronRight size={20} />
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
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
                        <span className="font-bold text-gray-900">May 2024</span>
                        <div className="flex gap-1">
                          <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400 disabled:opacity-30" disabled><ChevronRight className="rotate-180" size={18} /></button>
                          <button className="p-1.5 hover:bg-gray-50 rounded-lg text-gray-400"><ChevronRight size={18} /></button>
                        </div>
                      </div>
                      <div className="grid grid-cols-7 gap-1 text-center mb-4">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                          <span key={day} className="text-[10px] font-bold text-gray-400 uppercase">{day}</span>
                        ))}
                      </div>
                      <div className="grid grid-cols-7 gap-1">
                        {Array.from({ length: 31 }).map((_, i) => {
                          const isToday = i + 1 === 24;
                          const isPast = i + 1 < 24;
                          return (
                            <button
                              key={i}
                              disabled={isPast}
                              onClick={() => setSelectedDate(`May ${i + 1}, 2024`)}
                              className={`h-9 rounded-lg text-xs font-bold transition-all ${
                                selectedDate === `May ${i + 1}, 2024` 
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                                : isPast ? 'text-gray-200 cursor-not-allowed' : isToday ? 'text-blue-600 bg-blue-50' : 'hover:bg-blue-50 text-gray-700'
                              }`}
                            >
                              {i + 1}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Available Times</h3>
                         {selectedDate && <span className="text-[10px] font-bold text-blue-500">{selectedDate}</span>}
                      </div>
                      <div className="grid grid-cols-2 gap-2.5">
                        {TIME_SLOTS.map((time) => (
                          <button
                            key={time}
                            onClick={() => {
                              setSelectedTime(time);
                              nextStep();
                            }}
                            className={`py-3 px-4 rounded-xl text-xs font-bold border-2 transition-all ${
                              selectedTime === time 
                              ? 'border-blue-600 bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
                              : 'border-transparent bg-white shadow-sm hover:border-blue-200 text-gray-700'
                            }`}
                          >
                            {time}
                          </button>
                        ))}
                      </div>
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
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Full Name</label>
                          <Input required placeholder="e.g. John Doe" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Phone Number</label>
                          <Input required type="tel" placeholder="+1 (555) 000-0000" />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Email Address</label>
                        <Input required type="email" placeholder="john@example.com" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Notes (Optional)</label>
                        <textarea 
                          rows={4}
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
                        <span className="text-sm font-bold text-gray-900 text-right">{selectedDate}<br/>{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm font-medium text-gray-500">Location</span>
                        <span className="text-sm font-bold text-gray-900">{selectedService?.location}</span>
                      </div>
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
                      <Button variant="outline" className="h-12 px-8 font-bold text-xs uppercase tracking-widest">Add to Calendar</Button>
                      <Button onClick={() => setStep(1)} className="h-12 px-8 font-bold text-xs uppercase tracking-widest bg-blue-600">Back to Services</Button>
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
                            <Clock size={12} className="text-blue-500" /> {selectedService.duration}
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
                          <p className="font-bold text-gray-900 leading-tight mb-1">{selectedDate}</p>
                          <p className="text-xs text-purple-600 font-bold uppercase tracking-widest">{selectedTime}</p>
                        </>
                      ) : (
                        <p className="text-xs text-gray-300 italic">Please pick a slot...</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-gray-50 flex justify-between items-end">
                    <div>
                       <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Total Amount</p>
                       <p className="text-2xl font-black text-gray-900">{selectedService?.price || '$0.00'}</p>
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 text-right leading-relaxed">
                      Includes all taxes<br/>and clinic fees.
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
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);

export default PublicBooking;
