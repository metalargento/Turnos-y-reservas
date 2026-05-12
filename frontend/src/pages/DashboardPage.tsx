import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, Alert, Button } from '../components/ui';
import { onboardingApi } from '../api/onboarding';
import { useAuth } from '../contexts/AuthContext';
import { useBusinessContext } from '../contexts/BusinessContext';
import type { OnboardingProgress } from '../types';

export function DashboardPage() {
  const { user } = useAuth();
  const { activeBusiness, isLoading: businessLoading } = useBusinessContext();
  const [progress, setProgress] = useState<OnboardingProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!activeBusiness) return;
    loadProgress();
  }, [activeBusiness?.id]);

  const loadProgress = async () => {
    if (!activeBusiness) return;
    try {
      const progressData = await onboardingApi.getProgress(activeBusiness.id);
      setProgress(progressData);
    } catch (err) {
      console.error('Error cargando progreso:', err);
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
          <Button className="mt-4">Completar onboarding</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bienvenido, {user?.full_name}</h1>
        <p className="text-gray-500">{activeBusiness.name}</p>
      </div>

      {!activeBusiness.onboarding_completed && progress && (
        <Alert variant="info">
          <div className="flex justify-between items-center">
            <span>Tu negocio está en proceso de configuración</span>
            <Link to="/onboarding">
              <Button size="sm">Continuar onboarding</Button>
            </Link>
          </div>
        </Alert>
      )}

      {activeBusiness.onboarding_completed && (
        <Alert variant="success">
          ¡Tu negocio está activo y listo para recibir reservas!
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-black">{activeBusiness.name}</div>
            <div className="text-gray-500 text-sm mt-1">{activeBusiness.rubro}</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center">
            <div className="text-3xl font-bold text-black">{activeBusiness.slug}</div>
            <div className="text-gray-500 text-sm mt-1">
              <a
                href={`http://localhost:5173/book/${activeBusiness.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline"
              >
                Ver página pública
              </a>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="text-center">
            <div className={`text-3xl font-bold ${activeBusiness.plan_status === 'active' ? 'text-green-600' : 'text-gray-400'}`}>
              {activeBusiness.plan_status === 'active' ? 'Activo' : 'Inactivo'}
            </div>
            <div className="text-gray-500 text-sm mt-1">Estado del plan</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-4">Configuración</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Email:</span>
                <span className="font-medium">{activeBusiness.email_provider}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Anticipación:</span>
                <span className="font-medium">{activeBusiness.min_advance_hours}h</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Google Calendar:</span>
                <span className="font-medium">{activeBusiness.google_calendar_enabled ? 'Sí' : 'No'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <h3 className="font-semibold text-gray-900 mb-4">Próximos pasos</h3>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                <span>Agregar profesionales</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                <span className="text-gray-400">Definir disponibilidad</span>
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-gray-300 rounded-full"></span>
                <span className="text-gray-400">Configurar Mercado Pago</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
