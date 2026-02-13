
export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  NO_SHOW = 'NO_SHOW'
}

export interface ServiceType {
  id: string;
  name: string;
  duration: string;
  price?: string;
  location: string;
  active: boolean;
}

export interface Workspace {
  id: string;
  name: string;
  setupProgress: number;
  isActive: boolean;
  address?: string;
}

export interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  serviceId: string;
  serviceName: string;
  dateTime: string;
  status: BookingStatus;
  duration: number;
}

export interface ContactForm {
  id: string;
  title: string;
  description: string;
  fields: {
    name: boolean;
    email: boolean;
    phone: boolean;
    message: boolean;
  };
  responsesCount: number;
  status: 'Active' | 'Draft';
}
