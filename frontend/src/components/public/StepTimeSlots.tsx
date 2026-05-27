import React, { useState, useEffect } from 'react';
import { Button, Alert } from '../ui';
import { publicBookingsApi } from '../../api/publicBookings';
import type { PublicProfessionalItem, PublicServiceItem, TimeSlot } from '../../types';

interface Props {
  slug: string;
  professional: PublicProfessionalItem;
  service: PublicServiceItem;
  selectedDate: string;
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function StepTimeSlots({
  slug,
  professional,
  service,
  selectedDate,
  selectedSlot,
  onSelectSlot,
  onContinue,
  onBack,
}: Props) {
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  const loadSlots = async () => {
    try {
      setIsLoading(true);
      const response = await publicBookingsApi.getSlots(
        slug,
        professional.id,
        service.id,
        selectedDate,
      );
      setSlots(response.data.slots);
      setError('');
    } catch (err: any) {
      setError('Error al cargar horarios disponibles');
      setSlots([]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('es-AR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const getSlotClasses = (slot: TimeSlot, isSelected: boolean) => {
    const baseClasses =
      'px-4 py-3 rounded-lg font-medium transition-all text-sm whitespace-nowrap';

    if (slot.status === 'available') {
      return (
        baseClasses +
        (isSelected
          ? ' bg-black text-white border-2 border-black'
          : ' border border-gray-300 text-gray-900 hover:bg-black hover:text-white cursor-pointer')
      );
    }

    if (slot.status === 'taken' || slot.status === 'blocked') {
      return (
        baseClasses +
        ' bg-gray-100 text-gray-400 cursor-not-allowed opacity-60'
      );
    }

    if (slot.status === 'past') {
      return (
        baseClasses +
        ' bg-gray-100 text-gray-400 cursor-not-allowed opacity-40 line-through'
      );
    }

    return baseClasses;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Elige una hora
        </h2>
        <p className="text-gray-600 text-sm">
          {formatDate(selectedDate).charAt(0).toUpperCase() +
            formatDate(selectedDate).slice(1)}
        </p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {isLoading ? (
        <div className="text-center py-8">Cargando horarios...</div>
      ) : slots.length === 0 ? (
        <Alert variant="error">
          No hay horarios disponibles para esta fecha. Por favor, elige otra.
        </Alert>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-wrap gap-3">
            {slots.map((slot, index) => {
              const isSelected =
                selectedSlot?.starts_at === slot.starts_at &&
                selectedSlot?.ends_at === slot.ends_at;

              return (
                <button
                  key={index}
                  onClick={() => {
                    if (slot.status === 'available') {
                      onSelectSlot(slot);
                    }
                  }}
                  disabled={slot.status !== 'available'}
                  className={getSlotClasses(slot, isSelected)}
                  title={
                    slot.status === 'taken'
                      ? 'Ocupado'
                      : slot.status === 'blocked'
                        ? 'No disponible'
                        : slot.status === 'past'
                          ? 'Horario pasado'
                          : ''
                  }
                >
                  {formatTime(slot.starts_at)}
                </button>
              );
            })}
          </div>

          <div className="mt-6 text-xs text-gray-500">
            <p>
              Duración: <strong>{service.duration_minutes} minutos</strong>
            </p>
            <p className="mt-2">
              <span className="inline-block w-3 h-3 bg-gray-100 rounded mr-2"></span>
              Disponible
              <span className="inline-block w-3 h-3 bg-gray-300 rounded ml-4 mr-2"></span>
              Ocupado/Bloqueado
            </p>
          </div>
        </div>
      )}

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={onContinue} disabled={!selectedSlot}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
