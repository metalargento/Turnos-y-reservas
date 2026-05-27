import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card } from '../ui';
import type { PublicBusinessInfo } from '../../types';

interface Props {
  bookingId: string;
  onBookAnother: () => void;
  business: PublicBusinessInfo;
  wizardState: any;
}

export function BookingConfirmation({
  bookingId,
  onBookAnother,
  business,
  wizardState,
}: Props) {
  const navigate = useNavigate();

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
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success icon and message */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            ¡Tu reserva está confirmada!
          </h1>
          <p className="text-gray-600">
            Te enviamos los detalles a {wizardState.clientEmail}
          </p>
        </div>

        {/* Booking details */}
        <Card>
          <div className="p-6 space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Profesional</p>
                <p className="font-semibold text-gray-900">
                  {wizardState.professional.display_name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Servicio</p>
                <p className="font-semibold text-gray-900">
                  {wizardState.service.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Fecha</p>
                <p className="font-semibold text-gray-900">
                  {formatDate(wizardState.selectedSlot.starts_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Hora</p>
                <p className="font-semibold text-gray-900">
                  {formatTime(wizardState.selectedSlot.starts_at)} -{' '}
                  {formatTime(wizardState.selectedSlot.ends_at)}
                </p>
              </div>
            </div>

            <div className="pt-6 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">Cliente</p>
              <p className="font-semibold text-gray-900">
                {wizardState.clientName}
              </p>
              <p className="text-sm text-gray-600">{wizardState.clientEmail}</p>
              {wizardState.clientPhone && (
                <p className="text-sm text-gray-600">{wizardState.clientPhone}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Info and CTA */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center space-y-4">
          <p className="text-gray-600">
            Si necesitas cancelar tu reserva, ingresa tu email y nombre{' '}
            <button
              onClick={() => navigate(`/cancel/${business.slug}`)}
              className="text-black font-semibold hover:underline"
            >
              en esta página
            </button>
            .
          </p>
          <Button onClick={onBookAnother} className="w-full sm:w-auto">
            Hacer otra reserva
          </Button>
        </div>
      </div>
    </div>
  );
}
