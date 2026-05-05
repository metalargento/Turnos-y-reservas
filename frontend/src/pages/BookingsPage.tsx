import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, Alert } from '../components/ui';
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
  const [showForm, setShowForm] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [formData, setFormData] = useState<BookingCreateRequest>({
    professional_id: '',
    service_id: '',
    client_name: '',
    client_email: '',
    starts_at: '',
    ends_at: '',
  });

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
      setShowForm(false);
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Reservas</h1>
        <Button onClick={() => setShowForm(true)}>+ Nueva reserva</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        >
          <option value="">Todas las reservas</option>
          <option value="confirmed">Confirmadas</option>
          <option value="cancelled">Canceladas</option>
          <option value="completed">Completadas</option>
        </select>
      </div>

      {showForm && (
        <Card>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg">Nueva reserva</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Profesional *
                  </label>
                  <select
                    value={formData.professional_id}
                    onChange={(e) =>
                      setFormData({ ...formData, professional_id: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona profesional</option>
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
                    onChange={(e) => setFormData({ ...formData, service_id: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  >
                    <option value="">Selecciona servicio</option>
                    {services.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.duration_minutes} min)
                      </option>
                    ))}
                  </select>
                </div>
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Inicio *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.starts_at}
                    onChange={(e) => setFormData({ ...formData, starts_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fin *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.ends_at}
                    onChange={(e) => setFormData({ ...formData, ends_at: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Crear reserva
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

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
              <CardContent className="p-4">
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-900">{booking.client_name}</h3>
                    <p className="text-sm text-gray-600">{booking.client_email}</p>
                    {booking.client_phone && (
                      <p className="text-sm text-gray-600">{booking.client_phone}</p>
                    )}
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Profesional</p>
                    <p className="text-gray-900">{getProfessionalName(booking.professional_id || '')}</p>
                    <p className="text-sm text-gray-600">{getServiceName(booking.service_id || '')}</p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-700">Horario</p>
                    <p className="text-gray-900">{formatDate(booking.starts_at)}</p>
                    <p className="text-sm text-gray-600">hasta {formatDate(booking.ends_at)}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(booking.status)}`}>
                      {booking.status}
                    </span>
                    {booking.payment_required && (
                      <span className="px-3 py-1 rounded-full text-xs font-semibold bg-yellow-100 text-yellow-800">
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
                  <p className="text-sm text-gray-600 mt-2 italic">Nota: {booking.client_notes}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
