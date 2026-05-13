import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { useBusinessContext } from '../contexts/BusinessContext';
import { dashboardApi } from '../api/dashboard';
import type { DashboardStats } from '../types';

interface StatCard {
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

  useEffect(() => {
    if (!activeBusiness) return;
    loadStats();
  }, [activeBusiness?.id]);

  const loadStats = async () => {
    if (!activeBusiness) return;
    try {
      const data = await dashboardApi.getStats(activeBusiness.id);
      setStats(data);
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
      icon: '📅',
      label: 'Hoy',
      value: stats?.bookings_today ?? 0,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: '📊',
      label: 'Esta semana',
      value: stats?.bookings_this_week ?? 0,
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      icon: '📆',
      label: 'Este mes',
      value: stats?.bookings_this_month ?? 0,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      icon: '❌',
      label: 'Canceladas',
      value: stats?.cancelled_this_month ?? 0,
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
    {
      icon: '👥',
      label: 'Clientes únicos',
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

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Bienvenido, {user?.full_name}
        </h1>
        <p className="text-gray-500 text-lg mt-1">{activeBusiness.name}</p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className={stat.bgColor}>
            <CardContent className="p-4 text-center">
              <div className={`text-3xl font-bold ${stat.textColor} mb-1`}>
                {stat.value}
              </div>
              <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                <span>{stat.icon}</span>
                <span>{stat.label}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Próximas reservas */}
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Próximas reservas</h2>
            <Link
              to="/bookings"
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Ver todas
            </Link>
          </div>

          {stats?.upcoming_bookings && stats.upcoming_bookings.length > 0 ? (
            <div className="space-y-3">
              {stats.upcoming_bookings.map((booking) => (
                <div
                  key={booking.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition"
                >
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {booking.client_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {booking.professional_name && (
                        <span>{booking.professional_name}</span>
                      )}
                      {booking.professional_name && booking.service_name && <span> • </span>}
                      {booking.service_name && (
                        <span>{booking.service_name}</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">
                      {formatTime(booking.starts_at)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {formatDate(booking.starts_at)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              No tenés reservas próximas
            </div>
          )}
        </CardContent>
      </Card>

      {/* Accesos rápidos */}
      <Card>
        <CardContent className="p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Acciones rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Link
              to="/bookings"
              className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="text-2xl mb-2">📅</div>
              <div className="text-sm font-medium text-gray-900">Reservas</div>
            </Link>
            <Link
              to="/services"
              className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="text-2xl mb-2">🔧</div>
              <div className="text-sm font-medium text-gray-900">Servicios</div>
            </Link>
            <Link
              to="/professionals"
              className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="text-2xl mb-2">👥</div>
              <div className="text-sm font-medium text-gray-900">Profesionales</div>
            </Link>
            <Link
              to="/availability"
              className="p-4 text-center border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              <div className="text-2xl mb-2">⏰</div>
              <div className="text-sm font-medium text-gray-900">Disponibilidad</div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
