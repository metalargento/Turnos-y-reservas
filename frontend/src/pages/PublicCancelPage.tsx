import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { publicBookingsApi } from '../api/publicBookings';
import { Card, CardContent, CardHeader } from '../components/ui/Card';

export function PublicCancelPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [bookingId, setBookingId] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientName, setClientName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleCancel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      if (!slug || !bookingId || !clientEmail || !clientName) {
        throw new Error('Por favor completa todos los campos');
      }

      await publicBookingsApi.cancelBooking(slug, bookingId, clientEmail, clientName);
      setSuccess(true);
      setTimeout(() => {
        navigate(`/book/${slug}`);
      }, 2000);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('El email o nombre no coinciden con la reserva');
      } else if (err.response?.status === 404) {
        setError('La reserva no existe');
      } else {
        setError(err.message || 'Error al cancelar la reserva');
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
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

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto">
        <Card>
          <CardHeader>
            <h1 className="text-2xl font-bold text-gray-900">Cancelar reserva</h1>
            <p className="text-gray-600 text-sm mt-2">Ingresa los datos de tu reserva para cancelarla</p>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleCancel} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  ID de la reserva
                </label>
                <input
                  type="text"
                  value={bookingId}
                  onChange={(e) => setBookingId(e.target.value)}
                  placeholder="Ej: a1b2c3d4-e5f6-..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
                  disabled={isLoading}
                />
              </div>

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
                disabled={isLoading || !bookingId || !clientEmail || !clientName}
                className="w-full bg-black text-white py-2 rounded-lg font-medium hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? 'Cancelando...' : 'Cancelar reserva'}
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
