import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, Alert, TimeSlotSelector } from '../components/ui';
import { bookingsApi } from '../api/bookings';
import { professionalsApi } from '../api/professionals';
import { servicesApi } from '../api/services';
import { branchesApi } from '../api/branches';
import { useAuth } from '../contexts/AuthContext';
import { onboardingApi } from '../api/onboarding';
import type {
  Booking,
  Professional,
  Service,
  Branch,
  BookingCreateRequest,
} from '../types';

export function BookingsPage() {
  const { token: _ } = useAuth();
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formData, setFormData] = useState<BookingCreateRequest>({
    professional_id: '',
    service_id: '',
    client_name: '',
    client_email: '',
    starts_at: '',
    ends_at: '',
  });

  const calculateEndTime = (startTime: string, serviceDurationMinutes: number) => {
    const start = new Date(startTime);
    const end = new Date(start.getTime() + serviceDurationMinutes * 60000);
    return end.toISOString();
  };

  const handleTimeSlotChange = (datetime: string) => {
    const selectedService = services.find((s) => s.id === formData.service_id);
    if (selectedService) {
      const endTime = calculateEndTime(datetime, selectedService.duration_minutes);
      setFormData({ ...formData, starts_at: datetime, ends_at: endTime });
    } else {
      setFormData({ ...formData, starts_at: datetime });
    }
  };

  useEffect(() => {
    loadBusiness();
  }, []);

  useEffect(() => {
    if (businessId) {
      loadAllData();
    }
  }, [businessId, statusFilter]);

  const loadBusiness = async () => {
    try {
      const result = await onboardingApi.getMyBusiness();
      if (result.has_business && result.business) {
        setBusinessId(result.business.id);
      }
    } catch (err) {
      setError('No se pudo cargar el negocio');
    }
  };

  const loadAllData = async () => {
    if (!businessId) return;
    setIsLoading(true);
    try {
      const [bookingsResult, profsResult, servResult, branchResult] = await Promise.all([
        bookingsApi.list(businessId, statusFilter || undefined),
        professionalsApi.list(businessId),
        servicesApi.list(businessId),
        branchesApi.list(businessId),
      ]);
      setBookings(bookingsResult.data.bookings);
      setProfessionals(profsResult.data.professionals);
      setServices(servResult.data.services);
      setBranches(branchResult.data.branches);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessId || !formData.professional_id || !formData.service_id) return;

    try {
      await bookingsApi.create(businessId, formData);
      setFormData({
        professional_id: '',
        service_id: '',
        client_name: '',
        client_email: '',
        starts_at: '',
        ends_at: '',
      });
      loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear reserva');
    }
  };

  const handleCancel = async (bookingId: string) => {
    if (!confirm('¿Estás seguro de que querés cancelar esta reserva?')) return;
    try {
      await bookingsApi.cancel(bookingId, { cancellation_reason: 'Cancelado por administrador' });
      loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cancelar reserva');
    }
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getProfessionalName = (id: string) =>
    professionals.find((p) => p.id === id)?.display_name || 'Desconocido';

  const getServiceName = (id: string) => services.find((s) => s.id === id)?.name || 'Desconocido';

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-3 gap-6 min-h-screen">
        {/* Columna Izquierda: Formulario */}
        <div className="col-span-1">
          <Card className="sticky top-6">
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-lg">Nueva reserva</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profesional *
                  </label>
                  <select
                    value={formData.professional_id}
                    onChange={(e) =>
                      setFormData({ ...formData, professional_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 focus:ring-2 focus:ring-black focus:border-transparent transition"
                    required
                  >
                    <option value="">Seleccione profesional</option>
                    {professionals.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.display_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servicio *
                  </label>
                  <select
                    value={formData.service_id}
                    onChange={(e) => {
                      const serviceId = e.target.value;
                      setFormData({ ...formData, service_id: serviceId });
                      if (formData.starts_at && serviceId) {
                        const selectedService = services.find((s) => s.id === serviceId);
                        if (selectedService) {
                          const endTime = calculateEndTime(formData.starts_at, selectedService.duration_minutes);
                          setFormData((prev) => ({ ...prev, ends_at: endTime }));
                        }
                      }
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 focus:ring-2 focus:ring-black focus:border-transparent transition"
                    required
                  >
                    <option value="">Seleccione servicio</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.duration_minutes} min)
                      </option>
                    ))}
                  </select>
                </div>

                <Input
                  label="Nombre del cliente *"
                  value={formData.client_name}
                  onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                  required
                />

                <Input
                  label="Email del cliente *"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                  required
                />

                <Input
                  label="Teléfono (opcional)"
                  value={formData.client_phone || ''}
                  onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                />

                {formData.professional_id && (
                  <TimeSlotSelector
                    professionalId={formData.professional_id}
                    value={formData.starts_at}
                    onChange={handleTimeSlotChange}
                  />
                )}

                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormData({
                        professional_id: '',
                        service_id: '',
                        client_name: '',
                        client_email: '',
                        starts_at: '',
                        ends_at: '',
                      });
                    }}
                  >
                    Reset
                  </Button>
                  <Button type="submit" className="flex-1">
                    Crear reserva
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Lista de Reservas */}
        <div className="col-span-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrar por estado
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-slate-50 hover:bg-slate-100 focus:ring-2 focus:ring-black focus:border-transparent transition"
              >
                <option value="">Todas las reservas</option>
                <option value="confirmed">Confirmadas</option>
                <option value="cancelled">Canceladas</option>
                <option value="completed">Completadas</option>
              </select>
            </div>

            <div className="space-y-3">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center text-gray-500 py-8">
                    No hay reservas. Crea tu primera reserva.
                  </CardContent>
                </Card>
              ) : (
                bookings.map((booking) => (
                  <Card key={booking.id}>
                    <CardContent className="p-2">
                      <div className="grid grid-cols-2 gap-2 mb-1">
                        <div>
                          <h3 className="font-semibold text-sm text-gray-900">{booking.client_name}</h3>
                          <p className="text-xs text-gray-600">{booking.client_email}</p>
                          {booking.client_phone && (
                            <p className="text-xs text-gray-600">{booking.client_phone}</p>
                          )}
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-700">Profesional</p>
                          <p className="text-sm text-gray-900">{getProfessionalName(booking.professional_id || '')}</p>
                          <p className="text-xs text-gray-600">{getServiceName(booking.service_id || '')}</p>
                        </div>
                      </div>

                      <div className="mb-1 p-1 bg-gray-50 rounded text-xs">
                        <p className="font-medium text-gray-700">{formatDate(booking.starts_at)}</p>
                      </div>

                      <div className="flex items-center justify-between pt-1 border-t gap-1">
                        <div className="flex gap-1">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getStatusBadgeColor(booking.status)}`}>
                            {booking.status}
                          </span>
                          {booking.payment_required && (
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
                              💰 ${booking.payment_amount}
                            </span>
                          )}
                        </div>

                        {booking.status === 'confirmed' && (
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleCancel(booking.id)}
                          >
                            Cancelar
                          </Button>
                        )}
                      </div>

                      {booking.client_notes && (
                        <p className="text-xs text-gray-600 mt-1 italic">Nota: {booking.client_notes}</p>
                      )}
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
