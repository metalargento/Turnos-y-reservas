import React, { useState } from 'react';
import { Button, Input, Alert, Card } from '../ui';
import { publicBookingsApi } from '../../api/publicBookings';
import type { BookingWizardState } from '../../pages/PublicBookingPage';

interface Props {
  slug: string;
  wizardState: any;
  onStateChange: (state: any) => void;
  onConfirmBooking: (bookingId: string) => void;
  onBack: () => void;
}

export function StepClientForm({
  slug,
  wizardState,
  onStateChange,
  onConfirmBooking,
  onBack,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      setIsLoading(true);

      const response = await publicBookingsApi.createBooking(slug, {
        professional_id: wizardState.professional.id,
        service_id: wizardState.service.id,
        branch_id: undefined,
        client_name: wizardState.clientName,
        client_email: wizardState.clientEmail,
        client_phone: wizardState.clientPhone || undefined,
        client_notes: wizardState.clientNotes || undefined,
        starts_at: wizardState.selectedSlot.starts_at,
        ends_at: wizardState.selectedSlot.ends_at,
      });

      onConfirmBooking(response.data.booking.id);
    } catch (err: any) {
      if (err.response?.status === 409) {
        setError(
          'Este horario fue tomado mientras completabas el formulario. Por favor, selecciona otro horario.',
        );
      } else {
        setError(
          err.response?.data?.detail ||
            'Error al crear la reserva. Intenta de nuevo.',
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <Card>
        <div className="p-6 bg-gray-50">
          <h3 className="font-semibold text-gray-900 mb-4">
            Resumen de tu reserva
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Profesional:</span>
              <span className="font-medium text-gray-900">
                {wizardState.professional.display_name}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Servicio:</span>
              <span className="font-medium text-gray-900">
                {wizardState.service.name} ({wizardState.service.duration_minutes}{' '}
                min)
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fecha y hora:</span>
              <span className="font-medium text-gray-900">
                {formatDate(wizardState.selectedSlot.starts_at)} a las{' '}
                {formatTime(wizardState.selectedSlot.starts_at)}
              </span>
            </div>
            {wizardState.service.price && (
              <div className="flex justify-between pt-2 border-t border-gray-200">
                <span className="text-gray-600">Precio:</span>
                <span className="font-semibold text-gray-900">
                  ${wizardState.service.price.toLocaleString('es-AR')}
                </span>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Formulario */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="font-semibold text-gray-900">Tus datos</h3>

        {error && <Alert variant="error">{error}</Alert>}

        <Input
          label="Nombre completo *"
          type="text"
          placeholder="Juan Pérez"
          value={wizardState.clientName}
          onChange={(e) =>
            onStateChange({ ...wizardState, clientName: e.target.value })
          }
          required
        />

        <Input
          label="Email *"
          type="email"
          placeholder="juan@example.com"
          value={wizardState.clientEmail}
          onChange={(e) =>
            onStateChange({ ...wizardState, clientEmail: e.target.value })
          }
          required
        />

        <Input
          label="Teléfono"
          type="tel"
          placeholder="+54 9 1123456789"
          value={wizardState.clientPhone}
          onChange={(e) =>
            onStateChange({ ...wizardState, clientPhone: e.target.value })
          }
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Notas (opcional)
          </label>
          <textarea
            placeholder="Ej: Primera vez visitando, tengo alergia a..."
            value={wizardState.clientNotes}
            onChange={(e) =>
              onStateChange({ ...wizardState, clientNotes: e.target.value })
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
            rows={3}
          />
        </div>

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={onBack} disabled={isLoading}>
            Atrás
          </Button>
          <Button
            type="submit"
            isLoading={isLoading}
            disabled={!wizardState.clientName || !wizardState.clientEmail}
          >
            Confirmar reserva
          </Button>
        </div>
      </form>
    </div>
  );
}
