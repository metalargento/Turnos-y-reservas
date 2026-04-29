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
