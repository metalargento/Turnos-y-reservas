import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Alert } from '../components/ui';
import { availabilityApi } from '../api/availability';
import { professionalsApi } from '../api/professionals';
import { useBusinessContext } from '../contexts/BusinessContext';
import type { Professional, Availability, ScheduleBlock, AvailabilityCreateRequest, ScheduleBlockCreateRequest } from '../types';

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function AvailabilityPage() {
  const { activeBusiness, isLoading: businessLoading } = useBusinessContext();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProf, setSelectedProf] = useState<Professional | null>(null);
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [blocks, setBlocks] = useState<ScheduleBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockFormData, setBlockFormData] = useState<ScheduleBlockCreateRequest>({
    blocked_from: '',
    blocked_until: '',
    reason: '',
  });

  // Modal para crear/editar horarios
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [modalDayOfWeek, setModalDayOfWeek] = useState<number | null>(null);
  const [modalStartTime, setModalStartTime] = useState('09:00');
  const [modalEndTime, setModalEndTime] = useState('18:00');

  useEffect(() => {
    if (!activeBusiness) return;
    loadProfessionals();
  }, [activeBusiness?.id]);

  useEffect(() => {
    if (!selectedProf) return;
    loadProfData();
  }, [selectedProf?.id]);

  const loadProfessionals = async () => {
    if (!activeBusiness) return;
    try {
      setIsLoading(true);
      const result = await professionalsApi.list(activeBusiness.id);
      setProfessionals(result.data.professionals || []);
      if (result.data.professionals && result.data.professionals.length > 0) {
        setSelectedProf(result.data.professionals[0]);
      }
    } catch (err: any) {
      setError('Error al cargar profesionales');
    } finally {
      setIsLoading(false);
    }
  };

  const loadProfData = async () => {
    if (!selectedProf) return;
    try {
      setIsLoading(true);
      const [availResult, blocksResult] = await Promise.all([
        availabilityApi.getAvailability(selectedProf.id),
        availabilityApi.getScheduleBlocks(selectedProf.id),
      ]);
      setAvailability(availResult.data.availabilities || []);
      setBlocks(blocksResult.data.blocks || []);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar disponibilidad');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddTimeSlot = async (dayOfWeek: number) => {
    setModalDayOfWeek(dayOfWeek);
    setModalStartTime('09:00');
    setModalEndTime('18:00');
    setShowTimeModal(true);
  };

  const handleSaveTimeSlot = async () => {
    if (!selectedProf || modalDayOfWeek === null) return;
    try {
      const data: AvailabilityCreateRequest = {
        day_of_week: modalDayOfWeek,
        start_time: modalStartTime,
        end_time: modalEndTime,
      };
      await availabilityApi.createAvailability(selectedProf.id, data);
      await loadProfData();
      setShowTimeModal(false);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar horario');
    }
  };

  const handleDeleteAvailability = async (availId: string) => {
    if (!confirm('¿Eliminar este horario?')) return;
    try {
      await availabilityApi.deleteAvailability(availId);
      await loadProfData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar horario');
    }
  };

  const handleAddBlock = async () => {
    if (!selectedProf) return;
    try {
      await availabilityApi.createScheduleBlock(selectedProf.id, blockFormData);
      setBlockFormData({ blocked_from: '', blocked_until: '', reason: '' });
      setShowBlockForm(false);
      await loadProfData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear bloqueo');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('¿Eliminar este bloqueo?')) return;
    try {
      await availabilityApi.deleteScheduleBlock(blockId);
      await loadProfData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al eliminar bloqueo');
    }
  };

  const getAvailabilityForDay = (dayOfWeek: number) => {
    return availability.find(a => a.day_of_week === dayOfWeek && a.is_active);
  };

  const formatDate = (isoString: string) => {
    return new Date(isoString).toLocaleDateString('es-AR');
  };

  const formatDateRange = (from: string, to: string) => {
    return `${formatDate(from)} - ${formatDate(to)}`;
  };

  if (businessLoading || isLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Disponibilidad</h1>
        <p className="text-gray-500">Gestiona los horarios y bloqueos de tus profesionales</p>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Selector de profesional */}
      <Card>
        <CardContent className="pt-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Profesional
          </label>
          <select
            value={selectedProf?.id || ''}
            onChange={(e) => {
              const prof = professionals.find(p => p.id === e.target.value);
              setSelectedProf(prof || null);
            }}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
          >
            <option value="">Selecciona un profesional</option>
            {professionals.map(prof => (
              <option key={prof.id} value={prof.id}>
                {prof.display_name}
              </option>
            ))}
          </select>
        </CardContent>
      </Card>

      {selectedProf && (
        <>
          {/* Sección de horarios semanales */}
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Horarios semanales</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {DAYS_OF_WEEK.map((dayName, idx) => {
                  const avail = getAvailabilityForDay(idx);
                  return (
                    <div key={idx} className="p-4 border border-gray-200 rounded-lg">
                      <h3 className="font-medium text-gray-900 mb-3">{dayName}</h3>
                      {avail ? (
                        <div className="space-y-3">
                          <div className="text-sm text-gray-600">
                            {avail.start_time} — {avail.end_time}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteAvailability(avail.id)}
                            className="w-full"
                          >
                            Eliminar
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleAddTimeSlot(idx)}
                          className="w-full"
                        >
                          + Agregar horario
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Sección de bloqueos */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Bloqueos</h2>
                <Button size="sm" onClick={() => setShowBlockForm(!showBlockForm)}>
                  + Agregar bloqueo
                </Button>
              </div>

              {showBlockForm && (
                <div className="mb-6 p-4 bg-gray-50 rounded-lg space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Desde
                    </label>
                    <input
                      type="datetime-local"
                      value={blockFormData.blocked_from}
                      onChange={(e) => setBlockFormData({ ...blockFormData, blocked_from: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Hasta
                    </label>
                    <input
                      type="datetime-local"
                      value={blockFormData.blocked_until}
                      onChange={(e) => setBlockFormData({ ...blockFormData, blocked_until: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Motivo (opcional)
                    </label>
                    <input
                      type="text"
                      placeholder="Ej: Vacaciones, Capacitación..."
                      value={blockFormData.reason || ''}
                      onChange={(e) => setBlockFormData({ ...blockFormData, reason: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleAddBlock} className="flex-1">
                      Guardar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setShowBlockForm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {blocks.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">Sin bloqueos</p>
                ) : (
                  blocks.map(block => (
                    <div key={block.id} className="p-3 border border-gray-200 rounded-lg flex justify-between items-start">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">
                          {formatDateRange(block.blocked_from, block.blocked_until)}
                        </p>
                        {block.reason && (
                          <p className="text-xs text-gray-500 mt-1">{block.reason}</p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteBlock(block.id)}
                        className="ml-2"
                      >
                        Eliminar
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {/* Modal para crear/editar horario */}
      {showTimeModal && modalDayOfWeek !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Horario para {DAYS_OF_WEEK[modalDayOfWeek]}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desde
                </label>
                <input
                  type="time"
                  value={modalStartTime}
                  onChange={(e) => setModalStartTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Hasta
                </label>
                <input
                  type="time"
                  value={modalEndTime}
                  onChange={(e) => setModalEndTime(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveTimeSlot} className="flex-1">
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowTimeModal(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
