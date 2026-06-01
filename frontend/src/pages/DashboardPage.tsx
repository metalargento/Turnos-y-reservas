import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useBusinessContext } from '../contexts/BusinessContext';
import { dashboardApi } from '../api/dashboard';
import type { DashboardStats, UpcomingBooking, UniqueClient } from '../types';

interface StatCard {
  id: string;
  icon: string;
  label: string;
  value: number;
  bgColor: string;
  textColor: string;
}

export function DashboardPage() {
  const { user } = useAuth();
  const { activeBusiness, isLoading: businessLoading } = useBusinessContext();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<string>('upcoming');

  useEffect(() => {
    if (!activeBusiness) return;
    loadStats();
  }, [activeBusiness?.id]);

  const loadStats = async () => {
    if (!activeBusiness) return;
    try {
      const response = await dashboardApi.getStats(activeBusiness.id);
      setStats(response.data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (businessLoading || isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
      </div>
    );
  }

  if (!activeBusiness) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900">No tenés un negocio creado</h2>
        <Link to="/onboarding">
          <button className="mt-4 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800">
            Completar onboarding
          </button>
        </Link>
      </div>
    );
  }

  const statCards: StatCard[] = [
    {
      id: 'today',
      icon: '📅',
      label: 'Hoy',
      value: stats?.bookings_today ?? 0,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      id: 'week',
      icon: '📊',
      label: 'Esta semana',
      value: stats?.bookings_this_week ?? 0,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      id: 'month',
      icon: '📆',
      label: 'Este mes',
      value: stats?.bookings_this_month ?? 0,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      id: 'cancelled',
      icon: '❌',
      label: 'Canceladas',
      value: stats?.cancelled_this_month ?? 0,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      id: 'clients',
      icon: '👥',
      label: 'Clientes',
      value: stats?.unique_clients_this_month ?? 0,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  const formatTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleDateString('es-AR', { weekday: 'short', month: 'short', day: 'numeric' });
  };

  const getTabData = () => {
    if (!stats) return { type: 'bookings', data: [] };

    switch (selectedTab) {
      case 'today':
        return { type: 'bookings', data: stats.bookings_today_list };
      case 'week':
        return { type: 'bookings', data: stats.bookings_this_week_list };
      case 'month':
        return { type: 'bookings', data: stats.bookings_this_month_list };
      case 'cancelled':
        return { type: 'bookings', data: stats.cancelled_bookings_list };
      case 'clients':
        return { type: 'clients', data: stats.unique_clients_list };
      default:
        return { type: 'bookings', data: stats.upcoming_bookings };
    }
  };

  const getTabLabel = () => {
    const card = statCards.find(c => c.id === selectedTab);
    return card?.label || 'Próximas reservas';
  };

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex items-center gap-4">
        {activeBusiness.logo_url && (
          <img
            src={activeBusiness.logo_url}
            alt={activeBusiness.name}
            className="h-16 w-16 rounded-lg object-cover"
          />
        )}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-neutral-100">
            Bienvenido, {user?.full_name}
          </h1>
          <p className="text-gray-500 dark:text-neutral-400 text-lg mt-1">{activeBusiness.name}</p>
        </div>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 md:gap-4">
        {statCards.map((stat) => (
          <Card
            key={stat.id}
            className={`${stat.bgColor} ${selectedTab === stat.id ? 'ring-2 ring-offset-2 ring-black' : ''} cursor-pointer transition-all hover:shadow-md`}
            onClick={() => setSelectedTab(stat.id)}
          >
            <CardContent className="p-2 md:p-4 text-center">
              <div className={`text-2xl md:text-3xl font-bold ${stat.textColor} mb-0.5 md:mb-1`}>
                {stat.value}
              </div>
              <div className="text-xs md:text-sm text-gray-600 dark:text-neutral-400 flex items-center justify-center gap-1">
                <span>{stat.icon}</span>
                <span>{stat.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Panel de datos según tab seleccionado */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100">{getTabLabel()}</h2>
            {selectedTab !== 'upcoming' && (
              <Link
                to={selectedTab === 'clients' ? '/professionals' : '/bookings'}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Ver todas
              </Link>
            )}
          </div>

          {(() => {
            const { type, data } = getTabData();

            if (type === 'clients') {
              const clients = data as UniqueClient[];
              if (clients.length > 0) {
                return (
                  <div className="space-y-3">
                    {clients.map((client) => (
                      <div
                        key={client.client_email}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-neutral-100">
                            {client.client_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-neutral-400">
                            {client.client_email}
                            {client.client_phone && <span> • {client.client_phone}</span>}
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="px-2 py-1 md:px-3 bg-indigo-100 text-indigo-700 rounded-full text-xs md:text-sm font-medium whitespace-nowrap">
                            {client.booking_count} {client.booking_count === 1 ? 'reserva' : 'reservas'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
                    No hay clientes con reservas este mes
                  </div>
                );
              }
            } else {
              const bookings = data as UpcomingBooking[];
              if (bookings.length > 0) {
                return (
                  <div className="space-y-3">
                    {bookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 border border-gray-200 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-neutral-100">
                            {booking.client_name}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-neutral-400">
                            {booking.professional_name && (
                              <span>{booking.professional_name}</span>
                            )}
                            {booking.professional_name && booking.service_name && <span> • </span>}
                            {booking.service_name && (
                              <span>{booking.service_name}</span>
                            )}
                          </div>
                          {booking.status === 'cancelled' && booking.cancellation_reason && (
                            <div className="text-xs text-red-600 mt-1">
                              Motivo: {booking.cancellation_reason}
                            </div>
                          )}
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900 dark:text-neutral-100">
                            {formatTime(booking.starts_at)}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-neutral-400">
                            {formatDate(booking.starts_at)}
                          </div>
                          <div className="text-xs font-medium mt-1">
                            <span className={`px-2 py-0.5 rounded-full ${
                              booking.status === 'confirmed' || booking.status === 'rescheduled'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {booking.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              } else {
                return (
                  <div className="text-center py-8 text-gray-500 dark:text-neutral-400">
                    No hay reservas para este período
                  </div>
                );
              }
            }
          })()}
        </CardContent>
      </Card>

      {/* Accesos rápidos */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-neutral-100 mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/bookings"
              className="p-4 text-center border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
            >
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">Reservas</div>
            </Link>
            <Link
              to="/services"
              className="p-4 text-center border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
            >
              <div className="text-2xl mb-2">🔧</div>
              <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">Servicios</div>
            </Link>
            <Link
              to="/professionals"
              className="p-4 text-center border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">Profesionales</div>
            </Link>
            <Link
              to="/availability"
              className="p-4 text-center border border-gray-300 dark:border-neutral-600 rounded-lg hover:bg-gray-50 dark:hover:bg-neutral-700 transition"
            >
              <div className="text-2xl mb-2">⏰</div>
              <div className="text-sm font-medium text-gray-900 dark:text-neutral-100">Disponibilidad</div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
