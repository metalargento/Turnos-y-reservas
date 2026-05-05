export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'owner' | 'professional';
  is_active: boolean;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface Business {
  id: string;
  owner_id: string;
  name: string;
  slug: string;
  rubro: string;
  description?: string;
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
  plan_status: 'active' | 'expired' | 'cancelled';
  onboarding_completed: boolean;
  email_provider: 'resend' | 'smtp';
  min_advance_hours: number;
  google_calendar_enabled: boolean;
}

export interface Branch {
  id: string;
  business_id: string;
  name: string;
  address?: string;
  phone?: string;
  is_active: boolean;
}

export interface Service {
  id: string;
  business_id: string;
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
  is_active: boolean;
}

export interface OnboardingProgress {
  business_id: string;
  onboarding_completed: boolean;
  steps_completed: string[];
  steps_pending: string[];
  next_step: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}

export interface BusinessStepRequest {
  name: string;
  rubro: string;
  description?: string;
}

export interface BrandStepRequest {
  logo_url?: string;
  primary_color: string;
  secondary_color: string;
}

export interface BranchStepRequest {
  branch_name: string;
  address?: string;
  phone?: string;
}

export interface ServiceItemRequest {
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
}

export interface ServicesStepRequest {
  services: ServiceItemRequest[];
}

export interface AgendaStepRequest {
  min_advance_hours: number;
  email_provider: 'resend' | 'smtp';
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_password?: string;
  google_calendar_enabled: boolean;
}

export interface ServiceCreateRequest {
  name: string;
  description?: string;
  duration_minutes: number;
  price?: number;
}

export interface ServiceUpdateRequest {
  name?: string;
  description?: string;
  duration_minutes?: number;
  price?: number;
}

export interface BranchCreateRequest {
  name: string;
  address?: string;
  phone?: string;
}

export interface BranchUpdateRequest {
  name?: string;
  address?: string;
  phone?: string;
}

export interface Professional {
  id: string;
  business_id: string;
  display_name: string;
  branch_id?: string;
  avatar_url?: string;
  bio?: string;
  is_active: boolean;
}

export interface ProfessionalCreateRequest {
  display_name: string;
  branch_id?: string;
  avatar_url?: string;
  bio?: string;
}

export interface ProfessionalUpdateRequest {
  display_name?: string;
  branch_id?: string;
  avatar_url?: string;
  bio?: string;
}

export interface AssignServicesRequest {
  service_ids: string[];
}

export interface Booking {
  id: string;
  business_id: string;
  branch_id?: string;
  professional_id?: string;
  service_id?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_notes?: string;
  starts_at: string;
  ends_at: string;
  status: 'confirmed' | 'cancelled' | 'rescheduled' | 'completed';
  cancelled_by?: string;
  cancellation_reason?: string;
  payment_required: boolean;
  payment_status: 'pending' | 'paid' | 'refunded';
  payment_amount?: number;
  payment_id?: string;
  confirmation_token: string;
  created_at: string;
  updated_at: string;
}

export interface BookingCreateRequest {
  professional_id: string;
  service_id: string;
  branch_id?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_notes?: string;
  starts_at: string;
  ends_at: string;
  payment_required?: boolean;
  payment_amount?: number;
}

export interface BookingUpdateRequest {
  client_name?: string;
  client_email?: string;
  client_phone?: string;
  client_notes?: string;
  starts_at?: string;
  ends_at?: string;
}

export interface BookingCancelRequest {
  cancellation_reason?: string;
}
