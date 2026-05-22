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
  const [viewMode, setViewMode] = useState<'upcoming' | 'history'>('upcoming');
  const [searchQuery, setSearchQuery] = useState('');
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
  }, [businessId, viewMode]);

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
      const statusFilter = viewMode === 'upcoming' ? 'confirmed' : undefined;
      const [bookingsResult, profsResult, servResult, branchResult] = await Promise.all([
        bookingsApi.list(businessId, statusFilter),
        professionalsApi.list(businessId),
        servicesApi.list(businessId),
        branchesApi.list(businessId),
      ]);

      let allBookings = bookingsResult.data.bookings || [];
      if (viewMode === 'history') {
        allBookings = allBookings.filter(b => b.status !== 'confirmed');
      }

      const sortedBookings = allBookings.sort((a, b) =>
        new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime()
      );
      setBookings(sortedBookings);
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

  const filteredBookings = bookings.filter((booking) => {
    const query = searchQuery.toLowerCase();
    const professionalName = getProfessionalName(booking.professional_id || '').toLowerCase();
    const serviceName = getServiceName(booking.service_id || '').toLowerCase();

    return (
      booking.client_name.toLowerCase().includes(query) ||
      booking.client_email.toLowerCase().includes(query) ||
      (booking.client_phone?.toLowerCase().includes(query) ?? false) ||
      professionalName.includes(query) ||
      serviceName.includes(query)
    );
  });

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Reservas</h1>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-3 gap-6 min-h-screen">
        {/* Columna Izquierda: Formulario */}
        <div className="col-span-1">
          <Card className="sticky top-6">
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-lg dark:text-neutral-100">Nueva reserva</h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
                    Profesional *
                  </label>
                  <select
                    value={formData.professional_id}
                    onChange={(e) =>
                      setFormData({ ...formData, professional_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-600 rounded-lg bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent dark:text-neutral-100 transition"
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-neutral-300 mb-2">
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
                    className="w-full px-3 py-2 border border-slate-300 dark:border-neutral-600 rounded-lg bg-slate-50 dark:bg-neutral-800 hover:bg-slate-100 dark:hover:bg-neutral-700 focus:ring-2 focus:ring-black dark:focus:ring-white focus:border-transparent dark:text-neutral-100 transition"
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
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode('upcoming')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'upcoming'
                    ? 'bg-black text-white'
                    : 'border border-gray-300 text-gray-700 hover:border-black'
                }`}
              >
                Próximas
              </button>
              <button
                onClick={() => setViewMode('history')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  viewMode === 'history'
                    ? 'bg-black text-white'
                    : 'border border-gray-300 text-gray-700 hover:border-black'
                }`}
              >
                Historial
              </button>
            </div>

            <Input
              placeholder="Buscar por cliente, email, teléfono, profesional o servicio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full"
            />

            <div className="space-y-3">
              {bookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center text-gray-500 py-8">
                    No hay reservas. Crea tu primera reserva.
                  </CardContent>
                </Card>
              ) : filteredBookings.length === 0 ? (
                <Card>
                  <CardContent className="text-center text-gray-500 py-8">
                    No se encontraron reservas con "{searchQuery}".
                  </CardContent>
                </Card>
              ) : (
                filteredBookings.map((booking) => (
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
