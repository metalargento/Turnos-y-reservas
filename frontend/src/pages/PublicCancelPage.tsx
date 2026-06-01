import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicBookingsApi } from '../api/publicBookings';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import type { UpcomingBooking } from '../types';

export function PublicCancelPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  // Etapa 1: Buscar reservas
  const [step, setStep] = useState<'search' | 'list' | 'success'>('search');
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Etapa 2: Listar y cancelar
  const [bookings, setBookings] = useState<UpcomingBooking[]>([]);
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isCanceling, setIsCanceling] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!slug || !clientName || !clientEmail) {
        throw new Error('Por favor completa todos los campos');
      }

      const result = await publicBookingsApi.getClientBookings(slug, clientEmail);
      const upcomingBookings = result.data.bookings.filter(
        (b: any) => b.status === 'confirmed' && new Date(b.starts_at) > new Date()
      );

      if (upcomingBookings.length === 0) {
        setError('No encontramos reservas próximas con ese email');
        return;
      }

      setBookings(upcomingBookings);
      setStep('list');
    } catch (err: any) {
      setError(err.message || 'Error al buscar las reservas');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId: string) => {
    setIsCanceling(true);
    setError(null);

    try {
      if (!slug) throw new Error('Slug no encontrado');

      await publicBookingsApi.cancelBooking(slug, bookingId, clientEmail, clientName);
      setStep('success');
      setTimeout(() => {
        navigate(`/book/${slug}`);
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Error al cancelar la reserva');
      setIsCanceling(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-ES', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!slug) return null;

  // Pantalla de éxito
  if (step === 'success') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <div className="text-4xl mb-4">✓</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Reserva cancelada</h2>
            <p className="text-gray-600">Tu reserva ha sido cancelada exitosamente.</p>
            <p className="text-gray-500 text-sm mt-4">Redirigiendo...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Pantalla de búsqueda
  if (step === 'search') {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-md mx-auto">
          <Card>
            <CardHeader>
              <h1 className="text-2xl font-bold text-gray-900">Cancelar reserva</h1>
              <p className="text-gray-600 text-sm mt-2">
                Ingresa tu nombre y email para ver tus reservas
              </p>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}

              <form onSubmit={handleSearch} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tu nombre
                  </label>
                  <input
                    type="text"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Juan García"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    disabled={isLoading}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tu email
                  </label>
                  <input
                    type="email"
                    value={clientEmail}
                    onChange={(e) => setClientEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                    disabled={isLoading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading || !clientEmail || !clientName}
                  className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? 'Buscando...' : 'Ver mis reservas'}
                </button>

                <button
                  type="button"
                  onClick={() => navigate(`/book/${slug}`)}
                  disabled={isLoading}
                  className="w-full bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 disabled:opacity-50 transition-colors"
                >
                  Volver
                </button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Pantalla de listado de reservas
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-gray-900">Tus reservas</h1>
            <p className="text-gray-600 text-sm mt-2">
              Selecciona una reserva para cancelarla
            </p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <div className="space-y-3">
              {bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex justify-between items-start p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {booking.professional_name && booking.service_name
                        ? `${booking.professional_name} - ${booking.service_name}`
                        : booking.client_name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {formatDate(booking.starts_at)}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCancelBooking(booking.id)}
                    disabled={isCanceling || selectedBookingId !== null}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors ml-4 flex-shrink-0"
                  >
                    {isCanceling && selectedBookingId === booking.id ? 'Cancelando...' : 'Cancelar'}
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={() => {
                setStep('search');
                setClientName('');
                setClientEmail('');
                setBookings([]);
                setError(null);
              }}
              className="w-full mt-6 bg-gray-100 text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
            >
              Volver
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
