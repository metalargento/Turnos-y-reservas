/**
 * API funciones para endpoints públicos de bookings (widget de reservas).
 */
import { publicClient } from './publicClient';
import type {
  BusinessInfoResponse,
  AvailableDaysResponse,
  SlotsResponse,
  PublicBookingCreateRequest,
  PublicBookingConfirmResponse,
} from '../types';

export const publicBookingsApi = {
  /**
   * GET /public/bookings/{slug}
   * Obtener información del negocio con profesionales y servicios.
   */
  getBusinessInfo: (slug: string) =>
    publicClient.get<BusinessInfoResponse>(`/public/bookings/${slug}`),

  /**
   * GET /public/bookings/{slug}/availability
   * Obtener días del mes con slots disponibles.
   */
  getAvailableDays: (
    slug: string,
    professionalId: string,
    serviceId: string,
    year: number,
    month: number,
  ) =>
    publicClient.get<AvailableDaysResponse>(
      `/public/bookings/${slug}/availability`,
      {
        params: {
          professional_id: professionalId,
          service_id: serviceId,
          year,
          month,
        },
      },
    ),

  /**
   * GET /public/bookings/{slug}/slots
   * Obtener slots de horario para un día específico.
   */
  getSlots: (
    slug: string,
    professionalId: string,
    serviceId: string,
    date: string, // YYYY-MM-DD
  ) =>
    publicClient.get<SlotsResponse>(`/public/bookings/${slug}/slots`, {
      params: {
        professional_id: professionalId,
        service_id: serviceId,
        date,
      },
    }),

  /**
   * POST /public/bookings/{slug}
   * Crear una reserva pública sin autenticación.
   */
  createBooking: (slug: string, data: PublicBookingCreateRequest) =>
    publicClient.post<PublicBookingConfirmResponse>(
      `/public/bookings/${slug}`,
      data,
    ),

  /**
   * POST /public/bookings/{slug}/cancel
   * Cancelar una reserva usando email + nombre.
   */
  cancelBooking: (
    slug: string,
    bookingId: string,
    clientEmail: string,
    clientName: string,
  ) =>
    publicClient.post<PublicBookingConfirmResponse>(
      `/public/bookings/${slug}/cancel`,
      {},
      {
        params: {
          booking_id: bookingId,
          client_email: clientEmail,
          client_name: clientName,
        },
      },
    ),
};
