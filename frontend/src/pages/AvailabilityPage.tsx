import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, Button, Alert } from '../components/ui';
import { availabilityApi } from '../api/availability';
import { professionalsApi } from '../api/professionals';
import { useBusinessContext } from '../contexts/BusinessContext';
import type { Professional, Availability, ScheduleBlock, AvailabilityCreateRequest } from '../types';

const DAYS_OF_WEEK = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

const extractErrorMessage = (error: any): string => {
  const detail = error?.response?.data?.detail;

  if (Array.isArray(detail)) {
    return detail.map((e: any) => e.msg).join('; ') || 'Error desconocido';
  }

  if (typeof detail === 'string') {
    return detail;
  }

  return 'Error desconocido';
};

export function AvailabilityPage() {
  const navigate = useNavigate();
  const { activeBusiness, isLoading: businessLoading } = useBusinessContext();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [selectedProf, setSelectedProf] = useState<Professional | null>(null);
  const [profDataMap, setProfDataMap] = useState<{
    [profId: string]: { availability: Availability[]; blocks: ScheduleBlock[] };
  }>({});
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState('');

  // Form states
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockDate, setBlockDate] = useState('');
  const [blockFromTime, setBlockFromTime] = useState('09:00');
  const [blockUntilTime, setBlockUntilTime] = useState('18:00');
  const [blockReason, setBlockReason] = useState('');
  const [blockAllDay, setBlockAllDay] = useState(false);

  // Modal para crear/editar horarios
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [modalDayOfWeek, setModalDayOfWeek] = useState<number | null>(null);
  const [modalStartTime, setModalStartTime] = useState('09:00');
  const [modalEndTime, setModalEndTime] = useState('18:00');
  const [modalError, setModalError] = useState('');
  const [modalEditingId, setModalEditingId] = useState<string | null>(null);

  useEffect(() => {
    if (!activeBusiness) return;
    loadAllProfessionalsAndData();
  }, [activeBusiness?.id]);

  const loadAllProfessionalsAndData = async () => {
    if (!activeBusiness) return;
    try {
      setIsInitialLoading(true);
      const profsResult = await professionalsApi.list(activeBusiness.id);
      const profs = profsResult.data.professionals || [];
      setProfessionals(profs);

      const dataMap: Record<string, { availability: Availability[]; blocks: ScheduleBlock[] }> = {};
      const promises = profs.map(prof =>
        Promise.all([
          availabilityApi.getAvailability(prof.id),
          availabilityApi.getScheduleBlocks(prof.id),
        ]).then(([availResult, blocksResult]) => {
          dataMap[prof.id] = {
            availability: availResult.data.availabilities || [],
            blocks: blocksResult.data.blocks || [],
          };
        })
      );

      await Promise.all(promises);
      setProfDataMap(dataMap);

      if (profs.length > 0) {
        setSelectedProf(profs[0]);
      }
      setError('');
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Error al cargar datos');
    } finally {
      setIsInitialLoading(false);
    }
  };

  const updateProfData = async (profId: string) => {
    try {
      const [availResult, blocksResult] = await Promise.all([
        availabilityApi.getAvailability(profId),
        availabilityApi.getScheduleBlocks(profId),
      ]);
      setProfDataMap(prev => ({
        ...prev,
        [profId]: {
          availability: availResult.data.availabilities || [],
          blocks: blocksResult.data.blocks || [],
        },
      }));
      setError('');
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Error al cargar disponibilidad');
    }
  };

  const handleAddTimeSlot = (dayOfWeek: number, availId?: string, startTime?: string, endTime?: string) => {
    setModalDayOfWeek(dayOfWeek);
    setModalStartTime((startTime || '09:00').substring(0, 5));
    setModalEndTime((endTime || '18:00').substring(0, 5));
    setModalEditingId(availId || null);
    setModalError('');
    setShowTimeModal(true);
  };

  const handleSaveTimeSlot = async () => {
    if (!selectedProf || modalDayOfWeek === null) return;

    if (modalStartTime >= modalEndTime) {
      setModalError('La hora de inicio debe ser anterior a la de fin');
      return;
    }

    try {
      if (modalEditingId) {
        await availabilityApi.deleteAvailability(modalEditingId);
      }
      const data: AvailabilityCreateRequest = {
        day_of_week: modalDayOfWeek,
        start_time: modalStartTime,
        end_time: modalEndTime,
      };
      await availabilityApi.createAvailability(selectedProf.id, data);
      await updateProfData(selectedProf.id);
      setShowTimeModal(false);
      setModalError('');
      setError('');
      setModalEditingId(null);
    } catch (err: any) {
      setModalError(extractErrorMessage(err) || 'Error al guardar horario');
    }
  };

  const handleDeleteAvailability = async (availId: string) => {
    if (!confirm('¿Eliminar este horario?')) return;
    if (!selectedProf) return;
    try {
      await availabilityApi.deleteAvailability(availId);
      await updateProfData(selectedProf.id);
      setError('');
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Error al eliminar horario');
    }
  };

  const handleAddBlock = async () => {
    if (!selectedProf || !blockDate) return;
    try {
      const fromTime = blockAllDay ? '00:00' : blockFromTime;
      const untilTime = blockAllDay ? '23:59' : blockUntilTime;
      const blockedFrom = `${blockDate}T${fromTime}:00Z`;
      const blockedUntil = `${blockDate}T${untilTime}:00Z`;

      await availabilityApi.createScheduleBlock(selectedProf.id, {
        blocked_from: blockedFrom,
        blocked_until: blockedUntil,
        reason: blockReason || '',
      });

      setBlockDate('');
      setBlockFromTime('09:00');
      setBlockUntilTime('18:00');
      setBlockReason('');
      setBlockAllDay(false);
      setShowBlockForm(false);
      await updateProfData(selectedProf.id);
      setError('');
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Error al crear bloqueo');
    }
  };

  const handleDeleteBlock = async (blockId: string) => {
    if (!confirm('¿Eliminar este bloqueo?')) return;
    if (!selectedProf) return;
    try {
      await availabilityApi.deleteScheduleBlock(blockId);
      await updateProfData(selectedProf.id);
      setError('');
    } catch (err: any) {
      setError(extractErrorMessage(err) || 'Error al eliminar bloqueo');
    }
  };

  const getAvailabilityForDay = (dayOfWeek: number) => {
    if (!selectedProf) return [];
    const availability = profDataMap[selectedProf.id]?.availability || [];
    return availability.filter(a => a.day_of_week === dayOfWeek && a.is_active);
  };

  const getBlocks = () => {
    if (!selectedProf) return [];
    return profDataMap[selectedProf.id]?.blocks || [];
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    const day = date.getUTCDate().toString().padStart(2, '0');
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const year = date.getUTCFullYear();
    return `${day}/${month}/${year}`;
  };

  const formatBlockTime = (isoString: string) => {
    const date = new Date(isoString);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const isBlockAllDay = (from: string, to: string) => {
    return formatBlockTime(from) === '00:00' && formatBlockTime(to) === '23:59';
  };

  if (businessLoading || isInitialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (professionals.length === 0) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Disponibilidad</h1>
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-600 dark:text-neutral-400 mb-4">No hay profesionales configurados</p>
            <Button onClick={() => navigate('/professionals')}>
              Agregar profesionales
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Disponibilidad</h1>

      {error && <Alert variant="error">{error}</Alert>}

      {/* Selector de profesional con chips */}
      <div className="flex gap-2 flex-wrap">
        {professionals.map(prof => (
          <button
            key={prof.id}
            onClick={() => setSelectedProf(prof)}
            className={`px-4 py-2 rounded-full font-medium transition ${
              selectedProf?.id === prof.id
                ? 'bg-black dark:bg-white text-white dark:text-black'
                : 'border border-gray-300 dark:border-neutral-600 text-gray-700 dark:text-neutral-300 hover:border-gray-400 dark:hover:border-neutral-400'
            }`}
          >
            {prof.display_name}
          </button>
        ))}
      </div>

      {selectedProf && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Columna izquierda: Horarios semanales */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Horario semanal</h2>
                <div className="space-y-3">
                  {DAYS_OF_WEEK.map((dayName, idx) => {
                    const availList = getAvailabilityForDay(idx);
                    const isOpen = availList.length > 0;

                    return (
                      <div key={idx} className="flex items-start gap-3 p-3 border border-gray-200 dark:border-neutral-600 rounded-lg">
                        {/* Indicador de estado */}
                        <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${
                          isOpen ? 'bg-green-500' : 'bg-gray-300'
                        }`}></div>

                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900 dark:text-neutral-100 text-sm">{dayName}</h3>
                          {availList.length > 0 ? (
                            <div className="space-y-2 mt-2">
                              {availList.map(avail => (
                                <div
                                  key={avail.id}
                                  className="flex items-center justify-between bg-gray-50 dark:bg-neutral-700 p-2 rounded text-xs hover:bg-gray-100 dark:hover:bg-neutral-600 cursor-pointer transition"
                                  onClick={() => handleAddTimeSlot(idx, avail.id, avail.start_time, avail.end_time)}
                                >
                                  <span className="text-gray-700 dark:text-neutral-100">{avail.start_time.substring(0, 5)} hs — {avail.end_time.substring(0, 5)} hs</span>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteAvailability(avail.id);
                                    }}
                                    className="text-gray-400 hover:text-red-600 transition"
                                  >
                                    ✕
                                  </button>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">Cerrado</p>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddTimeSlot(idx)}
                          className="text-xs flex-shrink-0"
                        >
                          +
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Columna derecha: Bloqueos */}
          <div>
            <Card>
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">Bloqueos</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setShowBlockForm(!showBlockForm)}
                    className="text-xs"
                  >
                    {showBlockForm ? '✕' : '+'}
                  </Button>
                </div>

                {showBlockForm && (
                  <div className="mb-4 p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                        Fecha
                      </label>
                      <input
                        type="date"
                        value={blockDate}
                        onChange={(e) => setBlockDate(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-neutral-600 rounded text-xs dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                      />
                    </div>

                    <div>
                      <label className="flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-neutral-300">
                        <input
                          type="checkbox"
                          checked={blockAllDay}
                          onChange={(e) => setBlockAllDay(e.target.checked)}
                          className="w-3 h-3"
                        />
                        Todo el día
                      </label>
                    </div>

                    {!blockAllDay && (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                            Desde
                          </label>
                          <input
                            type="time"
                            value={blockFromTime}
                            onChange={(e) => setBlockFromTime(e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-neutral-600 rounded text-xs dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                            Hasta
                          </label>
                          <input
                            type="time"
                            value={blockUntilTime}
                            onChange={(e) => setBlockUntilTime(e.target.value)}
                            className="w-full px-2 py-1.5 border border-gray-300 dark:border-neutral-600 rounded text-xs dark:bg-neutral-800 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                          />
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-medium text-gray-700 dark:text-neutral-300 mb-1">
                        Motivo
                      </label>
                      <input
                        type="text"
                        placeholder="Vacaciones, feriado..."
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        className="w-full px-2 py-1.5 border border-gray-300 dark:border-neutral-600 rounded text-xs dark:bg-neutral-800 dark:text-neutral-100 placeholder-gray-400 dark:placeholder-neutral-500 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleAddBlock} className="flex-1 text-xs">
                        Guardar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowBlockForm(false)}
                        className="flex-1 text-xs"
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}

                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {getBlocks().length === 0 ? (
                    <p className="text-xs text-gray-500 dark:text-neutral-400 text-center py-4">Sin bloqueos</p>
                  ) : (
                    getBlocks().map(block => (
                      <div key={block.id} className="p-2 border border-gray-200 dark:border-neutral-600 rounded-lg">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-gray-900 dark:text-neutral-100">
                              {formatDate(block.blocked_from)}
                            </p>
                            <p className="text-xs text-gray-600 dark:text-neutral-400">
                              {isBlockAllDay(block.blocked_from, block.blocked_until)
                                ? 'Todo el día'
                                : `${formatBlockTime(block.blocked_from)} hs - ${formatBlockTime(block.blocked_until)} hs`
                              }
                            </p>
                            {block.reason && (
                              <p className="text-xs text-gray-500 dark:text-neutral-400 mt-1">{block.reason}</p>
                            )}
                          </div>
                          <button
                            onClick={() => handleDeleteBlock(block.id)}
                            className="text-gray-400 hover:text-red-600 transition flex-shrink-0 mt-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modal para crear/editar horario */}
      {showTimeModal && modalDayOfWeek !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-neutral-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">
              {modalEditingId ? 'Editar' : 'Nuevo'} horario para {DAYS_OF_WEEK[modalDayOfWeek]}
            </h3>
            {modalError && <Alert variant="error">{modalError}</Alert>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Desde
                </label>
                <input
                  type="time"
                  value={modalStartTime}
                  onChange={(e) => {
                    setModalStartTime(e.target.value);
                    setModalError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg text-sm dark:bg-neutral-700 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                  Hasta
                </label>
                <input
                  type="time"
                  value={modalEndTime}
                  onChange={(e) => {
                    setModalEndTime(e.target.value);
                    setModalError('');
                  }}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg text-sm dark:bg-neutral-700 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-black dark:focus:ring-white"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveTimeSlot} className="flex-1">
                  Guardar
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTimeModal(false);
                    setModalEditingId(null);
                  }}
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
