import React, { useState, useEffect } from 'react';
import { availabilityApi } from '../../api/availability';
import type { Availability } from '../../types';

interface TimeSlotSelectorProps {
  professionalId: string;
  value: string;
  onChange: (datetime: string) => void;
}

interface ScheduleBlock {
  id: string;
  blocked_from: string;
  blocked_until: string;
  reason?: string;
}

export function TimeSlotSelector({ professionalId, value, onChange }: TimeSlotSelectorProps) {
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [availableHours, setAvailableHours] = useState<string[]>([]);
  const [blockedHours, setBlockedHours] = useState<Set<string>>(new Set());
  const [availableDates, setAvailableDates] = useState<string[]>([]);

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
    generateAvailableDates();
  }, [availabilities]);

  useEffect(() => {
    if (selectedDate) {
      updateAvailableHours();
    }
  }, [selectedDate, availabilities, scheduleBlocks]);

  const loadAvailability = async () => {
    try {
      const [availResult, blocksResult] = await Promise.all([
        availabilityApi.getAvailability(professionalId),
        fetch(`/api/schedule-blocks/${professionalId}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        }).then(r => r.json()),
      ]);
      setAvailabilities(availResult.data.availabilities);
      setScheduleBlocks(blocksResult.data?.schedule_blocks || []);
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

  const isTimeBlocked = (dateStr: string, timeStr: string): boolean => {
    const dateTime = new Date(`${dateStr}T${timeStr}:00`);
    return scheduleBlocks.some((block) => {
      const blockStart = new Date(block.blocked_from);
      const blockEnd = new Date(block.blocked_until);
      return dateTime >= blockStart && dateTime < blockEnd;
    });
  };

  const formatDateForDisplay = (dateStr: string): string => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const generateAvailableDates = () => {
    const dates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(checkDate.getDate() + i);
      const dayOfWeek = checkDate.getUTCDay();
      const hasAvailability = availabilities.some(
        (a) => a.day_of_week === dayOfWeek && a.is_active
      );
      if (hasAvailability) {
        const dateStr = checkDate.toISOString().split('T')[0];
        dates.push(dateStr);
      }
    }

    setAvailableDates(dates);
  };

  const updateAvailableHours = () => {
    if (!selectedDate) {
      setAvailableHours([]);
      setBlockedHours(new Set());
      return;
    }

    const dayOfWeek = getDayOfWeek(selectedDate);
    const dayAvailability = availabilities.find(
      (a) => a.day_of_week === dayOfWeek && a.is_active
    );

    if (!dayAvailability) {
      setAvailableHours([]);
      setBlockedHours(new Set());
      return;
    }

    const [startHour, startMin] = dayAvailability.start_time.split(':').map(Number);
    const [endHour, endMin] = dayAvailability.end_time.split(':').map(Number);
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;

    const hours: string[] = [];
    const blocked = new Set<string>();

    for (let min = startTotalMin; min < endTotalMin; min += 30) {
      const h = Math.floor(min / 60);
      const m = min % 60;
      const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      hours.push(timeStr);

      if (isTimeBlocked(selectedDate, timeStr)) {
        blocked.add(timeStr);
      }
    }

    setAvailableHours(hours);
    setBlockedHours(blocked);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
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

  if (isLoading) {
    return <div className="text-sm text-gray-600 dark:text-neutral-400">Cargando disponibilidad...</div>;
  }

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">
          Fecha *
        </label>
        <select
          value={selectedDate}
          onChange={handleDateChange}
          className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-600 rounded-lg bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent dark:text-neutral-100 transition"
          required
        >
          <option value="">Seleccione fecha</option>
          {availableDates.map((date) => (
            <option key={date} value={date}>
              {formatDateForDisplay(date)}
            </option>
          ))}
        </select>
      </div>

      {selectedDate && availableHours.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">
            Horario turno *
          </label>
          <select
            value={selectedTime}
            onChange={handleTimeChange}
            className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-600 rounded-lg bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent dark:text-neutral-100 transition"
            required
          >
            <option value="">Seleccione horario</option>
            {availableHours.map((hour) => (
              <option
                key={hour}
                value={hour}
                disabled={blockedHours.has(hour)}
              >
                {hour}
                {blockedHours.has(hour) ? ' ✗ Bloqueado' : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedDate && availableHours.length === 0 && (
        <p className="text-sm text-red-600 dark:text-red-400">
          No hay horarios disponibles este día. Selecciona otra fecha.
        </p>
      )}
    </div>
  );
}
