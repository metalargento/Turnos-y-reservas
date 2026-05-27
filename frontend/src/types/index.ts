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
  plan_expires_at?: string;
  onboarding_completed: boolean;
  email_provider: 'resend' | 'smtp';
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
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
  services?: string[];
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

// ============================================
// Public API Types (Widget de reservas)
// ============================================

export interface PublicServiceItem {
  id: string;
  name: string;
  duration_minutes: number;
  price?: number;
}

export interface PublicProfessionalItem {
  id: string;
  display_name: string;
  avatar_url?: string;
  bio?: string;
  services: PublicServiceItem[];
}

export interface PublicBusinessInfo {
  id: string;
  name: string;
  slug: string;
  rubro?: string;
  description?: string;
  logo_url?: string;
  primary_color: string;
  min_advance_hours: number;
}

export interface BusinessInfoResponse {
  business: PublicBusinessInfo;
  professionals: PublicProfessionalItem[];
}

export interface AvailableDaysResponse {
  year: number;
  month: number;
  available_days: number[];
}

export interface TimeSlot {
  starts_at: string;
  ends_at: string;
  status: 'available' | 'taken' | 'blocked' | 'past';
}

export interface SlotsResponse {
  date: string;
  duration_minutes: number;
  slots: TimeSlot[];
}

export interface PublicBookingCreateRequest {
  professional_id: string;
  service_id: string;
  branch_id?: string;
  client_name: string;
  client_email: string;
  client_phone?: string;
  client_notes?: string;
  starts_at: string;
  ends_at: string;
}

export interface PublicBookingConfirmResponse {
  message: string;
  booking: Booking;
}

export interface Availability {
  id: string;
  professional_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

export interface ScheduleBlock {
  id: string;
  professional_id: string;
  blocked_from: string;
  blocked_until: string;
  reason?: string;
  created_by?: string;
}

export interface AvailabilityCreateRequest {
  day_of_week: number;
  start_time: string;
  end_time: string;
}

export interface ScheduleBlockCreateRequest {
  blocked_from: string;
  blocked_until: string;
  reason?: string;
}

export interface UpcomingBooking {
  id: string;
  client_name: string;
  professional_name?: string;
  service_name?: string;
  starts_at: string;
  status: string;
  cancellation_reason?: string;
}

export interface UniqueClient {
  client_email: string;
  client_name: string;
  client_phone?: string;
  booking_count: number;
}

export interface DashboardStats {
  bookings_today: number;
  bookings_this_week: number;
  bookings_this_month: number;
  cancelled_this_month: number;
  unique_clients_this_month: number;
  upcoming_bookings: UpcomingBooking[];
  bookings_today_list: UpcomingBooking[];
  bookings_this_week_list: UpcomingBooking[];
  bookings_this_month_list: UpcomingBooking[];
  cancelled_bookings_list: UpcomingBooking[];
  unique_clients_list: UniqueClient[];
}
