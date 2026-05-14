import React, { useState, useEffect } from 'react';
import { availabilityApi } from '../../api/availability';
import type { Availability } from '../../types';

interface TimeSlotSelectorProps {
  professionalId: string;
  value: string;
  onChange: (datetime: string) => void;
}

export function TimeSlotSelector({ professionalId, value, onChange }: TimeSlotSelectorProps) {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableHours, setAvailableHours] = useState<string[]>([]);

  useEffect(() => {
    loadAvailability();
  }, [professionalId]);

  useEffect(() => {
    if (value) {
      const date = new Date(value);
      const dateStr = date.toISOString().split('T')[0];
      const timeStr = date.toTimeString().slice(0, 5);
      setSelectedDate(dateStr);
      setSelectedTime(timeStr);
    }
  }, [value]);

  useEffect(() => {
    if (selectedDate) {
      updateAvailableHours();
    }
  }, [selectedDate, availabilities]);

  const loadAvailability = async () => {
    try {
      const result = await availabilityApi.getAvailability(professionalId);
      setAvailabilities(result.data.availabilities);
    } catch (err) {
      console.error('Error cargando disponibilidad:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDayOfWeek = (dateStr: string): number => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.getUTCDay();
  };

  const updateAvailableHours = () => {
    if (!selectedDate) {
      setAvailableHours([]);
      return;
    }

    const dayOfWeek = getDayOfWeek(selectedDate);
    const dayAvailability = availabilities.find(
      (a) => a.day_of_week === dayOfWeek && a.is_active
    );

    if (!dayAvailability) {
      setAvailableHours([]);
      return;
    }

    const [startHour, startMin] = dayAvailability.start_time.split(':').map(Number);
    const [endHour, endMin] = dayAvailability.end_time.split(':').map(Number);
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    const hours: string[] = [];
    for (let min = startTotalMin; min < endTotalMin; min += 30) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      hours.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
    }

    setAvailableHours(hours);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    setSelectedTime('');
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTime = e.target.value;
    setSelectedTime(newTime);
    if (selectedDate && newTime) {
      const datetime = `${selectedDate}T${newTime}`;
      onChange(datetime);
    }
  };

  const getDisabledDates = (): Set<string> => {
    const disabled = new Set<string>();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      const dayOfWeek = checkDate.getUTCDay();
      const hasAvailability = availabilities.some(
        (a) => a.day_of_week === dayOfWeek && a.is_active
      );
      if (!hasAvailability) {
        const dateStr = checkDate.toISOString().split('T')[0];
        disabled.add(dateStr);
      }
    }

    return disabled;
  };

  if (isLoading) {
    return <div className="text-sm text-gray-600">Cargando disponibilidad...</div>;
  }

  const disabledDates = getDisabledDates();
  const minDate = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fecha *
        </label>
        <input
          type="date"
          value={selectedDate}
          onChange={handleDateChange}
          min={minDate}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
          required
        />
        {selectedDate && disabledDates.has(selectedDate) && (
          <p className="text-xs text-red-600 mt-1">⚠️ No hay disponibilidad este día</p>
        )}
      </div>

      {selectedDate && availableHours.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horario turno *
          </label>
          <select
            value={selectedTime}
            onChange={handleTimeChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
            required
          >
            <option value="">Selecciona horario</option>
            {availableHours.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedDate && availableHours.length === 0 && (
        <p className="text-sm text-red-600">
          No hay horarios disponibles este día. Selecciona otra fecha.
        </p>
      )}
    </div>
  );
}
