
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, ChevronRight } from 'lucide-react';

export const cn = (...classes: (string | boolean | undefined)[]) => classes.filter(Boolean).join(' ');

export const Button = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost', isLoading?: boolean }>(
  ({ className, variant = 'primary', isLoading, children, ...props }, ref) => {
    const variants = {
      primary: 'bg-[#4A90E2] text-white hover:bg-[#357ABD] shadow-sm',
      secondary: 'bg-slate-900 text-white hover:bg-slate-800 shadow-sm',
      outline: 'border border-gray-200 bg-transparent hover:bg-gray-50 text-gray-700',
      danger: 'bg-red-500 text-white hover:bg-red-600 shadow-sm',
      ghost: 'bg-transparent hover:bg-gray-100 text-gray-600',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 active:scale-95 disabled:opacity-70 disabled:pointer-events-none focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:ring-offset-2',
          variants[variant],
          className
        )}
        disabled={isLoading || props.disabled}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-11 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-gray-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A90E2] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all shadow-sm',
          className
        )}
        {...props}
      />
    );
  }
);

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div 
    className={cn('bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300', className)}
    {...props}
  >
    {children}
  </div>
);

export const Badge: React.FC<{ children: React.ReactNode; className?: string; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' }> = ({ children, className, variant = 'default' }) => {
  const variants = {
    default: 'bg-gray-100 text-gray-800',
    success: 'bg-green-100 text-green-800',
    warning: 'bg-yellow-100 text-yellow-800',
    danger: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
  };
  return (
    <span className={cn('px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider', variants[variant], className)}>
      {children}
    </span>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse bg-slate-200 rounded-lg relative overflow-hidden after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_2s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/20 after:to-transparent', className)} />
);

export const Modal: React.FC<{ 
  isOpen: boolean; 
  onClose: () => void; 
  title: string; 
  description?: string; 
  children: React.ReactNode;
  footer?: React.ReactNode;
  variant?: 'default' | 'danger'
}> = ({ isOpen, onClose, title, description, children, footer, variant = 'default' }) => (
  <AnimatePresence>
    {isOpen && (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
        />
        <motion.div 
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="relative w-full max-w-lg bg-white rounded-[24px] shadow-2xl overflow-hidden"
        >
          <div className="p-6 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {variant === 'danger' && <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center"><AlertCircle size={20} /></div>}
              <div>
                <h3 className={cn("font-bold text-gray-900", variant === 'danger' && "text-red-600")}>{title}</h3>
                {description && <p className="text-xs text-gray-400">{description}</p>}
              </div>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <X size={20} />
            </button>
          </div>
          <div className="p-6">{children}</div>
          {footer && <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-3">{footer}</div>}
        </motion.div>
      </div>
    )}
  </AnimatePresence>
);

export const EmptyState: React.FC<{ 
  title: string; 
  description: string; 
  icon?: React.ReactNode;
  action?: React.ReactNode;
}> = ({ title, description, icon, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-2xl flex items-center justify-center mb-6 border border-slate-100">
      {icon || <AlertCircle size={32} />}
    </div>
    <h3 className="text-lg font-bold text-slate-900">{title}</h3>
    <p className="text-slate-500 text-sm mt-2 max-w-xs mx-auto mb-8 font-medium">{description}</p>
    {action}
  </div>
);

// New TourTooltip component for pop-up guides
export const TourTooltip: React.FC<{
  targetId: string;
  title: string;
  description: string;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  position?: 'top' | 'bottom' | 'left' | 'right';
}> = ({ targetId, title, description, currentStep, totalSteps, onNext, onSkip, position = 'right' }) => {
  const [coords, setCoords] = useState({ top: 0, left: 0 });
  const [targetVisible, setTargetVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const el = document.getElementById(targetId);
      if (el) {
        const rect = el.getBoundingClientRect();
        let top = 0;
        let left = 0;

        switch (position) {
          case 'right':
            top = rect.top + rect.height / 2;
            left = rect.right + 12;
            break;
          case 'left':
            top = rect.top + rect.height / 2;
            left = rect.left - 12;
            break;
          case 'bottom':
            top = rect.bottom + 12;
            left = rect.left + rect.width / 2;
            break;
          case 'top':
            top = rect.top - 12;
            left = rect.left + rect.width / 2;
            break;
        }
        setCoords({ top, left });
        setTargetVisible(true);
      } else {
        setTargetVisible(false);
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    const interval = setInterval(updatePosition, 500); // Poll for dynamic elements

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      clearInterval(interval);
    };
  }, [targetId, position]);

  if (!targetVisible) return null;

  const arrowStyles = {
    right: 'left-0 top-1/2 -translate-x-full -translate-y-1/2 border-r-[#4A90E2]',
    left: 'right-0 top-1/2 translate-x-full -translate-y-1/2 border-l-[#4A90E2]',
    bottom: 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-b-[#4A90E2]',
    top: 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-t-[#4A90E2]',
  };

  const transformOrigin = {
    right: 'left',
    left: 'right',
    bottom: 'top',
    top: 'bottom',
  };

  return (
    <div 
      className="fixed z-[9999] pointer-events-none"
      style={{ 
        top: coords.top, 
        left: coords.left,
        transform: position === 'right' ? 'translateY(-50%)' : position === 'left' ? 'translate(-100%, -50%)' : position === 'bottom' ? 'translateX(-50%)' : 'translate(-50%, -100%)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, x: position === 'right' ? -10 : position === 'left' ? 10 : 0, y: position === 'bottom' ? -10 : position === 'top' ? 10 : 0 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        className="relative bg-[#4A90E2] text-white p-5 rounded-xl shadow-2xl w-64 pointer-events-auto"
      >
        {/* Arrow */}
        <div className={cn("absolute w-0 h-0 border-[6px] border-transparent", arrowStyles[position])} />
        
        <div className="flex items-center justify-between mb-3">
          {/* Step indicators (dots) */}
          <div className="flex gap-1">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div key={i} className={cn("h-1 rounded-full transition-all", i < currentStep ? "w-4 bg-white/40" : i === currentStep ? "w-6 bg-white" : "w-1.5 bg-white/20")} />
            ))}
          </div>
          <button onClick={onSkip} className="text-white/60 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <h4 className="font-bold text-sm mb-1">{title}</h4>
        <p className="text-xs text-white/90 leading-relaxed mb-4">{description}</p>
        
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold opacity-60">{currentStep + 1} of {totalSteps}</span>
          <button 
            onClick={onNext}
            className="bg-white text-[#4A90E2] px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-white/90 active:scale-95 transition-all"
          >
            {currentStep === totalSteps - 1 ? 'Finish' : 'Next'}
            <ChevronRight size={14} />
          </button>
        </div>
      </motion.div>
    </div>
  );
};
