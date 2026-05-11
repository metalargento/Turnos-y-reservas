import React, { useState } from 'react';
import { Button, Card } from '../ui';
import type { PublicBusinessInfo } from '../../types';

interface Props {
  confirmationToken: string;
  onBookAnother: () => void;
  business: PublicBusinessInfo;
  wizardState: any;
}

export function BookingConfirmation({
  confirmationToken,
  onBookAnother,
  business,
  wizardState,
}: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(confirmationToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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

        {/* Confirmation token */}
        <Card className="bg-blue-50 border-blue-200">
          <div className="p-6">
            <p className="text-sm font-medium text-blue-900 mb-3">
              Código de confirmación (guárdalo para cancelar o modificar tu reserva)
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 bg-white px-4 py-3 rounded border border-blue-200 font-mono text-sm text-gray-900 break-all">
                {confirmationToken}
              </code>
              <button
                onClick={handleCopyToken}
                className="px-4 py-3 bg-white border border-blue-200 rounded hover:bg-blue-50 transition-colors"
                title="Copiar"
              >
                {copied ? '✓' : '📋'}
              </button>
            </div>
          </div>
        </Card>

        {/* Info and CTA */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center space-y-4">
          <p className="text-gray-600">
            Si necesitas cancelar o modificar tu reserva, usa el código de confirmación
            anterior.
          </p>
          <Button onClick={onBookAnother} className="w-full sm:w-auto">
            Hacer otra reserva
          </Button>
        </div>
      </div>
    </div>
  );
}
