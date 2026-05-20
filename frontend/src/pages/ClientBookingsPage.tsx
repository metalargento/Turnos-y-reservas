import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, Alert, Button } from '../components/ui';
import { publicBookingsApi } from '../api/publicBookings';
import type { Booking } from '../types';

export function ClientBookingsPage() {
  const { slug } = useParams<{ slug: string }>();
  const [searchParams] = useSearchParams();

  const email = searchParams.get('email') || '';
  const phone = searchParams.get('telefono') || '';

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<'upcoming' | 'history' | 'cancelled'>('upcoming');

  useEffect(() => {
    if (!slug || !email || !phone) {
      setError('Email y teléfono son requeridos');
      setIsLoading(false);
      return;
    }
    loadBookings();
  }, [slug, email, phone]);

  const loadBookings = async () => {
    if (!slug || !email || !phone) return;
    setIsLoading(true);
    setError('');
    try {
      const response = await publicBookingsApi.getClientBookings(slug, email, phone);
      if (response.data.bookings && response.data.bookings.length > 0) {
        const sorted = response.data.bookings.sort((a, b) =>
          new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime()
        );
        setBookings(sorted);
      } else {
        setBookings([]);
        setError('Email o teléfono incorrectos');
      }
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar las reservas');
      setBookings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que querés cancelar esta reserva?')) return;
    if (!slug) return;

    try {
      const booking = bookings.find(b => b.id === bookingId);
      if (!booking) return;

      await publicBookingsApi.cancelBooking(
        slug,
        bookingId,
        booking.client_email,
        booking.client_name
      );
      loadBookings();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cancelar reserva');
    }
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    if (!domain) return email;
    return `${local.substring(0, 1)}****@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (phone.length < 10) return phone;
    return `+54 9 11 ****${phone.slice(-4)}`;
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDateOnly = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const formatTimeOnly = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getFilteredBookings = () => {
    const now = new Date().toISOString();

    if (viewMode === 'upcoming') {
      return bookings.filter(b =>
        b.status === 'confirmed' && b.ends_at > now
      );
    }

    if (viewMode === 'cancelled') {
      return bookings.filter(b => b.status === 'cancelled');
    }

    // historial
    return bookings.filter(b =>
      (b.status === 'confirmed' && b.ends_at <= now) ||
      b.status === 'completed'
    );
  };

  const getTabLabel = () => {
    const counts = {
      upcoming: bookings.filter(b => b.status === 'confirmed' && b.ends_at > new Date().toISOString()).length,
      cancelled: bookings.filter(b => b.status === 'cancelled').length,
      history: bookings.filter(b =>
        (b.status === 'confirmed' && b.ends_at <= new Date().toISOString()) ||
        b.status === 'completed'
      ).length,
    };
    return counts;
  };

  const counts = getTabLabel();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!slug || !email || !phone) {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <Alert variant="error">
          Datos incompletos. Por favor accede usando el link de tu email.
        </Alert>
      </div>
    );
  }

  const filteredBookings = getFilteredBookings();

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      {/* Encabezado */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Mis Reservas</h1>
        <div className="text-sm text-gray-600 space-y-1">
          <p>📧 Email: <span className="font-medium">{maskEmail(email)}</span></p>
          <p>📱 Teléfono: <span className="font-medium">{maskPhone(phone)}</span></p>
        </div>
      </div>

      {/* Error */}
      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setViewMode('upcoming')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            viewMode === 'upcoming'
              ? 'bg-black text-white'
              : 'border border-gray-300 text-gray-700 hover:border-black'
          }`}
        >
          Próximas ({counts.upcoming})
        </button>
        <button
          onClick={() => setViewMode('history')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            viewMode === 'history'
              ? 'bg-black text-white'
              : 'border border-gray-300 text-gray-700 hover:border-black'
          }`}
        >
          Historial ({counts.history})
        </button>
        <button
          onClick={() => setViewMode('cancelled')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            viewMode === 'cancelled'
              ? 'bg-black text-white'
              : 'border border-gray-300 text-gray-700 hover:border-black'
          }`}
        >
          Canceladas ({counts.cancelled})
        </button>
      </div>

      {/* Lista de reservas */}
      <div className="space-y-4">
        {filteredBookings.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-12">
              No hay reservas para este período
            </CardContent>
          </Card>
        ) : (
          filteredBookings.map((booking) => (
            <Card key={booking.id}>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Cliente y detalles */}
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.client_name}</h3>
                    {booking.professional_name && (
                      <p className="text-sm text-gray-600 mt-1">
                        Con: <span className="font-medium">{booking.professional_name}</span>
                      </p>
                    )}
                  </div>

                  {/* Fecha y hora */}
                  <div>
                    <p className="text-sm font-medium text-gray-700">Fecha y Hora</p>
                    <p className="text-sm text-gray-900 font-medium">
                      {formatDateOnly(booking.starts_at)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatTimeOnly(booking.starts_at)}
                    </p>
                  </div>

                  {/* Estado y botones */}
                  <div className="flex flex-col items-end justify-between">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        booking.status === 'confirmed'
                          ? 'bg-green-100 text-green-700'
                          : booking.status === 'completed'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {booking.status === 'confirmed'
                        ? 'Confirmada'
                        : booking.status === 'completed'
                        ? 'Completada'
                        : 'Cancelada'}
                    </span>

                    {booking.status === 'confirmed' && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleCancel(booking.id)}
                        className="mt-2"
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>

                {/* Servicio */}
                {booking.service_name && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600">
                      Servicio: <span className="font-medium text-gray-900">{booking.service_name}</span>
                    </p>
                  </div>
                )}

                {/* Motivo cancelación */}
                {booking.status === 'cancelled' && booking.cancellation_reason && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-red-600">
                      Motivo: {booking.cancellation_reason}
                    </p>
                  </div>
                )}

                {/* Notas */}
                {booking.client_notes && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-xs text-gray-600 italic">
                      Nota: {booking.client_notes}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
