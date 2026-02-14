import { apiFetch } from '../api';

// ============================================
// TYPES
// ============================================

export interface Form {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  formFields: Array<{
    name: string;
    label: string;
    type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox' | 'radio';
    // Using loose type for options for now as it's JSONB
    options?: any[];
    required: boolean;
  }>;
  linkedServiceTypeId?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Workspace {
  id: string;
  businessName: string;
  slug?: string;
  businessType?: string;
  address: string | null;
  timezone: string;
  contactEmail: string;
  isActive: boolean;
  setupCompleted: boolean;
  setupPercentage?: number;
  createdAt: string;
  updatedAt: string;
  role?: 'owner' | 'staff';
  permissions?: any;
  addedAt?: string;
}

export interface ServiceType {
  id: string;
  workspaceId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilitySchedule {
  id: string;
  workspaceId: string;
  dayOfWeek: number;
  dayName?: string;
  startTime: string;
  endTime: string;
  isActive: boolean;
  createdAt: string;
}

export interface Booking {
  id: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'no_show' | 'cancelled';
  notes: string | null;
  createdAt: string;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
  };
  serviceType: {
    id: string;
    name: string;
    duration: number;
    location: string;
  };
}

export interface StaffMember {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  isActive: boolean;
  permissions: any;
  addedAt: string;
}

export interface SessionData {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    isActive: boolean;
    createdAt: string;
  };
  workspaces: Workspace[];
}

// ============================================
// AUTH SERVICES
// ============================================

export const authService = {
  getSession: async (): Promise<SessionData> => {
    const response = await apiFetch<{ success: boolean; data: SessionData }>('/auth/session');
    return response.data;
  },
};

// ============================================
// WORKSPACE SERVICES
// ============================================

export const workspaceService = {
  create: async (data: {
    businessName: string;
    businessType?: string;
    address?: string;
    timezone?: string;
    contactEmail: string;
  }): Promise<Workspace> => {
    const response = await apiFetch<{ success: boolean; data: { workspace: Workspace } }>('/workspaces', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data.workspace;
  },

  update: async (workspaceId: string, data: {
    businessName?: string;
    address?: string;
    timezone?: string;
    contactEmail?: string;
  }): Promise<Workspace> => {
    const response = await apiFetch<{ success: boolean; data: { workspace: Workspace } }>(`/workspaces/${workspaceId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data.workspace;
  },

  activate: async (workspaceId: string): Promise<Workspace> => {
    const response = await apiFetch<{ success: boolean; data: { workspace: Workspace } }>(`/workspaces/${workspaceId}/activate`, {
      method: 'POST',
    });
    return response.data.workspace;
  },

  getStatus: async (workspaceId: string): Promise<{
    workspace: Workspace;
    setupProgress: any;
    completionPercentage: number;
    canActivate: boolean;
  }> => {
    const response = await apiFetch<{ success: boolean; data: any }>(`/workspaces/${workspaceId}/status`);
    return response.data;
  },

  delete: async (workspaceId: string): Promise<{ message: string }> => {
    const response = await apiFetch<{ success: boolean; message: string }>(`/workspaces/${workspaceId}`, {
      method: 'DELETE',
    });
    return { message: response.message };
  },
};

// ============================================
// BOOKING SERVICES
// ============================================

export const bookingService = {
  getPublicBookingPage: async (workspaceId: string): Promise<{
    workspace: {
      id: string;
      businessName: string;
      address: string;
      timezone: string;
    };
    serviceTypes: ServiceType[];
    availability: AvailabilitySchedule[];
  }> => {
    const response = await apiFetch<{ success: boolean; data: any }>(`/bookings/public/${workspaceId}`, {
      auth: false,
    });
    return response.data;
  },

  createPublicBooking: async (data: {
    workspaceId: string;
    serviceTypeId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    bookingDate: string;
    bookingTime: string;
    notes?: string;
  }): Promise<{ booking: any; contact: any }> => {
    const response = await apiFetch<{ success: boolean; data: any }>('/customer-bookings/create', {
      method: 'POST',
      body: JSON.stringify(data),
      auth: false,
    });
    return response.data;
  },

  getWorkspaceBookings: async (workspaceId: string): Promise<Booking[]> => {
    const response = await apiFetch<{ success: boolean; data: { bookings: Booking[] } }>(`/customer-bookings/${workspaceId}`);
    return response.data.bookings;
  },

  updateBookingStatus: async (bookingId: string, status: Booking['status']): Promise<Booking> => {
    const response = await apiFetch<{ success: boolean; data: { booking: Booking } }>(`/customer-bookings/${bookingId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
    return response.data.booking;
  },

  getServiceTypes: async (workspaceId: string): Promise<ServiceType[]> => {
    const response = await apiFetch<{ success: boolean; data: { serviceTypes: ServiceType[] } }>(`/bookings/service-types/${workspaceId}`);
    return response.data.serviceTypes;
  },

  createServiceType: async (data: {
    workspaceId: string;
    name: string;
    description?: string;
    durationMinutes: number;
    location: string;
  }): Promise<ServiceType> => {
    const response = await apiFetch<{ success: boolean; data: { serviceType: ServiceType } }>('/bookings/service-types', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data.serviceType;
  },

  updateServiceType: async (serviceTypeId: string, data: {
    name?: string;
    description?: string;
    durationMinutes?: number;
    location?: string;
    isActive?: boolean;
  }): Promise<ServiceType> => {
    const response = await apiFetch<{ success: boolean; data: { serviceType: ServiceType } }>(`/bookings/service-types/${serviceTypeId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return response.data.serviceType;
  },

  deleteServiceType: async (serviceTypeId: string): Promise<void> => {
    await apiFetch(`/bookings/service-types/${serviceTypeId}`, {
      method: 'DELETE',
    });
  },

  getAvailability: async (workspaceId: string): Promise<AvailabilitySchedule[]> => {
    const response = await apiFetch<{ success: boolean; data: { schedules: AvailabilitySchedule[] } }>(`/bookings/availability/${workspaceId}`);
    return response.data.schedules;
  },

  setAvailability: async (workspaceId: string, schedules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[]): Promise<AvailabilitySchedule[]> => {
    const response = await apiFetch<{ success: boolean; data: { schedules: AvailabilitySchedule[] } }>('/bookings/availability', {
      method: 'POST',
      body: JSON.stringify({ workspaceId, schedules }),
    });
    return response.data.schedules;
  },
};

// ============================================
// STAFF SERVICES
// ============================================

export const staffService = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
  }): Promise<any> => {
    const response = await apiFetch<{ success: boolean; data: any }>('/staff/register', {
      method: 'POST',
      body: JSON.stringify(data),
      auth: false,
    });
    return response.data;
  },

  addToWorkspace: async (workspaceId: string, data: {
    staffEmail: string;
    permissions?: any;
  }): Promise<any> => {
    const response = await apiFetch<{ success: boolean; data: any }>(`/staff/workspaces/${workspaceId}/add`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return response.data;
  },

  updatePermissions: async (workspaceId: string, staffId: string, permissions: any): Promise<any> => {
    const response = await apiFetch<{ success: boolean; data: any }>(`/staff/workspaces/${workspaceId}/staff/${staffId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissions }),
    });
    return response.data;
  },

  removeFromWorkspace: async (workspaceId: string, staffId: string): Promise<void> => {
    await apiFetch(`/staff/workspaces/${workspaceId}/staff/${staffId}`, {
      method: 'DELETE',
    });
  },

  getWorkspaceStaff: async (workspaceId: string): Promise<StaffMember[]> => {
    const response = await apiFetch<{ success: boolean; data: { staff: StaffMember[] } }>(`/staff/workspaces/${workspaceId}`);
    return response.data.staff;
  },

  getMyWorkspaces: async (): Promise<Workspace[]> => {
    const response = await apiFetch<{ success: boolean; data: { workspaces: Workspace[] } }>('/staff/my-workspaces');
    return response.data.workspaces;
  },
};

// ============================================
// CONTACT SERVICES
// ============================================

export const contactService = {
  submitForm: async (data: {
    workspaceId: string;
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    message?: string;
  }): Promise<{ contactId: string; conversationId: string }> => {
    const response = await apiFetch<{ success: boolean; data: any }>('/contacts/submit', {
      method: 'POST',
      body: JSON.stringify(data),
      auth: false,
    });
    return response.data;
  },

  getFormConfig: async (workspaceId: string): Promise<{
    workspaceId: string;
    businessName: string;
    isActive: boolean;
    fields: Array<{ name: string; label: string; type: string; required: boolean }>;
  }> => {
    const response = await apiFetch<{ success: boolean; data: any }>(`/contacts/form-config/${workspaceId}`, {
      auth: false,
    });
    return response.data;
  },

  getContacts: async (workspaceId: string): Promise<Contact[]> => {
    const response = await apiFetch<{ success: boolean; data: { contacts: any[] } }>(`/contacts/workspace/${workspaceId}`);
    return response.data.contacts.map(c => ({
      id: c.id,
      firstName: c.first_name,
      lastName: c.last_name,
      email: c.email,
      phone: c.phone,
      createdAt: c.created_at,
      source: c.source,
      conversationCount: parseInt(c.conversation_count || '0'),
      lastInteraction: c.last_interaction
    }));
  },
};

export interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  createdAt: string;
  source: string;
  conversationCount: number;
  lastInteraction: string | null;
}

// ============================================
// FORM SERVICES
// ============================================

export const formService = {
  getForms: async (workspaceId: string): Promise<Form[]> => {
    const response = await apiFetch<{ success: boolean; data: { forms: any[] } }>(`/forms/workspace/${workspaceId}`);
    // Map backend snake_case to frontend camelCase if needed, or rely on TS types matching if backend returns camelCase.
    // Backend returns forms as rows, so snake_case keys like form_fields, etc.
    // Let's assume we map them here or the backend implementation returns mixed case?
    // The backend controller returns `result.rows`. Postgres driver usually returns columns as is (snake_case).
    // The backend `createForm` returns `form_fields` etc.
    // We should map them for consistency.
    return response.data.forms.map(mapFormFromDb);
  },

  getById: async (formId: string): Promise<Form> => {
    const response = await apiFetch<{ success: boolean; data: { form: any } }>(`/forms/${formId}`);
    return mapFormFromDb(response.data.form);
  },

  create: async (data: {
    workspaceId: string;
    name: string;
    description?: string;
    fields: any[];
    linkedServiceTypeId?: string;
  }): Promise<Form> => {
    const response = await apiFetch<{ success: boolean; data: { form: any } }>('/forms', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return mapFormFromDb(response.data.form);
  },

  update: async (formId: string, data: {
    name?: string;
    description?: string;
    fields?: any[];
    isActive?: boolean;
    linkedServiceTypeId?: string;
  }): Promise<Form> => {
    const response = await apiFetch<{ success: boolean; data: { form: any } }>(`/forms/${formId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return mapFormFromDb(response.data.form);
  },

  delete: async (formId: string): Promise<void> => {
    await apiFetch(`/forms/${formId}`, {
      method: 'DELETE',
    });
  },

  getPublicConfig: async (formId: string): Promise<{
    id: string;
    workspaceId: string;
    name: string;
    businessName: string;
    description?: string;
    fields: any[];
  }> => {
    const response = await apiFetch<{ success: boolean; data: any }>(`/forms/public/${formId}`, {
      auth: false,
    });
    return response.data;
  },

  submitPublicForm: async (formId: string, data: any): Promise<void> => {
    await apiFetch(`/forms/public/${formId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
      auth: false,
    });
  },

  getSubmissions: async (formId: string): Promise<any[]> => {
    const response = await apiFetch<{ success: boolean; data: { submissions: any[] } }>(`/forms/${formId}/submissions`);
    return response.data.submissions.map(s => ({
      id: s.id,
      contact: {
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        phone: s.phone
      },
      submissionData: s.submission_data,
      status: s.status,
      submittedAt: s.created_at,
    }));
  },

  getWorkspaceSubmissions: async (workspaceId: string): Promise<any[]> => {
    const response = await apiFetch<{ success: boolean; data: { submissions: any[] } }>(`/forms/workspace/${workspaceId}/submissions`);
    return response.data.submissions.map(s => ({
      id: s.id,
      contact: {
        firstName: s.first_name,
        lastName: s.last_name,
        email: s.email,
        phone: s.phone
      },
      formName: s.form_name,
      submissionData: s.submission_data,
      status: s.status,
      submittedAt: s.created_at,
    }));
  },
};

export interface Message {
  id: string;
  conversationId: string;
  senderType: 'contact' | 'staff' | 'system';
  senderId: string;
  channel: 'email' | 'sms' | 'system';
  content: string;
  isRead: boolean;
  sentAt: string;
}

export interface Conversation {
  id: string;
  workspaceId: string;
  contactId: string;
  updatedAt: string;
  contact: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  isLastMessageRead: boolean;
  status: 'active' | 'closed' | 'archived';
}

export const conversationService = {
  getConversations: async (workspaceId: string): Promise<Conversation[]> => {
    const response = await apiFetch<{ success: boolean; data: { conversations: any[] } }>(`/conversations/workspace/${workspaceId}`);
    return response.data.conversations.map(c => ({
      id: c.id,
      workspaceId: c.workspace_id,
      contactId: c.contact_id,
      updatedAt: c.updated_at,
      contact: {
        firstName: c.first_name,
        lastName: c.last_name,
        email: c.email,
        phone: c.phone
      },
      lastMessage: c.last_message,
      lastMessageAt: c.last_message_at,
      isLastMessageRead: c.is_last_message_read,
      status: c.status
    }));
  },

  getMessages: async (conversationId: string): Promise<Message[]> => {
    const response = await apiFetch<{ success: boolean; data: { messages: any[] } }>(`/conversations/${conversationId}/messages`);
    return response.data.messages.map(m => ({
      id: m.id,
      conversationId: m.conversation_id,
      senderType: m.sender_type,
      senderId: m.sender_id,
      channel: m.channel,
      content: m.content,
      isRead: m.is_read,
      sentAt: m.created_at
    }));
  },

  reply: async (conversationId: string, content: string): Promise<Message> => {
    const response = await apiFetch<{ success: boolean; data: { message: any } }>(`/conversations/${conversationId}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content })
    });
    const m = response.data.message;
    return {
      id: m.id,
      conversationId: m.conversation_id,
      senderType: m.sender_type,
      senderId: m.sender_id,
      channel: m.channel,
      content: m.content,
      isRead: m.is_read,
      sentAt: m.created_at
    };
  }
};

const mapFormFromDb = (dbForm: any): Form => ({
  id: dbForm.id,
  workspaceId: dbForm.workspace_id,
  name: dbForm.name,
  description: dbForm.description,
  formFields: dbForm.form_fields,
  linkedServiceTypeId: dbForm.linked_service_type_id,
  isActive: dbForm.is_active,
  createdAt: dbForm.created_at,
});
