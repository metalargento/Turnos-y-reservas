import React, { useState, useEffect } from 'react';
import { Button, Alert } from '../ui';
import { publicBookingsApi } from '../../api/publicBookings';
import type { PublicProfessionalItem, PublicServiceItem } from '../../types';

interface Props {
  slug: string;
  professional: PublicProfessionalItem;
  service: PublicServiceItem;
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function StepCalendar({
  slug,
  professional,
  service,
  selectedDate,
  onSelectDate,
  onContinue,
  onBack,
}: Props) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [availableDays, setAvailableDays] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadAvailableDays();
  }, [currentDate.getFullYear(), currentDate.getMonth()]);

  const loadAvailableDays = async () => {
    try {
      setIsLoading(true);
      const response = await publicBookingsApi.getAvailableDays(
        slug,
        professional.id,
        service.id,
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
      );
      setAvailableDays(response.data.available_days);
      setError('');
    } catch (err: any) {
      setError('Error al cargar días disponibles');
      setAvailableDays([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    const today = new Date();
    if (newDate.getFullYear() > today.getFullYear() ||
        (newDate.getFullYear() === today.getFullYear() &&
         newDate.getMonth() >= today.getMonth())) {
      setCurrentDate(newDate);
    }
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const monthName = currentDate.toLocaleDateString('es-AR', {
    month: 'long',
    year: 'numeric',
  });

  const canGoBack =
    currentDate.getFullYear() > new Date().getFullYear() ||
    (currentDate.getFullYear() === new Date().getFullYear() &&
      currentDate.getMonth() > new Date().getMonth());

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day);
  }

  const handleSelectDate = (day: number) => {
    const dateStr = `${currentDate.getFullYear()}-${String(
      currentDate.getMonth() + 1,
    ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    onSelectDate(dateStr);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Elige una fecha
        </h2>

        {error && <Alert variant="error">{error}</Alert>}

        {isLoading ? (
          <div className="text-center py-8">Cargando...</div>
        ) : (
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-6">
              <button
                onClick={handlePrevMonth}
                disabled={!canGoBack}
                className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed rounded"
              >
                ←
              </button>
              <h3 className="text-lg font-semibold text-gray-900 capitalize">
                {monthName}
              </h3>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-100 rounded"
              >
                →
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-semibold text-gray-600 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} />;
                }

                const isAvailable = availableDays.includes(day);
                const dateStr = `${currentDate.getFullYear()}-${String(
                  currentDate.getMonth() + 1,
                ).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isSelected = selectedDate === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => handleSelectDate(day)}
                    disabled={!isAvailable}
                    className={`p-3 text-sm font-medium rounded-lg transition-all ${
                      isSelected
                        ? 'bg-black text-white border-2 border-black'
                        : isAvailable
                          ? 'bg-white border border-gray-300 hover:bg-black hover:text-white text-gray-900 cursor-pointer'
                          : 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex justify-between pt-4">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <Button onClick={onContinue} disabled={!selectedDate}>
          Continuar
        </Button>
      </div>
    </div>
  );
}
