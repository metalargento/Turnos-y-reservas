import { apiClient } from './client';
import type {
  Booking,
  BookingCreateRequest,
  BookingUpdateRequest,
  BookingCancelRequest,
} from '../types';

export const bookingsApi = {
  list: (businessId: string, status?: string, startDate?: string, endDate?: string) => {
    let url = `/bookings/${businessId}`;
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    if (params.toString()) url += `?${params.toString()}`;

    return apiClient.get<{ bookings: Booking[]; count: number }>(url);
  },

  get: (businessId: string, bookingId: string) =>
    apiClient.get<Booking>(`/bookings/${businessId}/${bookingId}`),

  create: (businessId: string, data: BookingCreateRequest) =>
    apiClient.post<Booking>(`/bookings/${businessId}`, data),

  update: (bookingId: string, data: BookingUpdateRequest) =>
    apiClient.put<Booking>(`/bookings/${bookingId}`, data),

  cancel: (bookingId: string, data: BookingCancelRequest) =>
    apiClient.delete(`/bookings/${bookingId}`, { data }),

  getByToken: (confirmationToken: string) =>
    apiClient.get<Booking>(`/public/bookings/confirm/${confirmationToken}`),

  cancelByToken: (confirmationToken: string, data: BookingCancelRequest) =>
    apiClient.post(`/public/bookings/confirm/${confirmationToken}/cancel`, data),
};
