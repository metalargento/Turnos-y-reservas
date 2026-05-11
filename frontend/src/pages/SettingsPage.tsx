import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, Alert } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { onboardingApi } from '../api/onboarding';
import type { Business } from '../types';

export function SettingsPage() {
  const { token } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    primaryColor: '#000000',
    secondaryColor: '#FFFFFF',
    minAdvanceHours: 1,
  });

  useEffect(() => {
    loadBusiness();
  }, []);

  const loadBusiness = async () => {
    try {
      const result = await onboardingApi.getMyBusiness();
      if (result.has_business && result.business) {
        setBusiness(result.business);
        setFormData({
          primaryColor: result.business.primary_color || '#000000',
          secondaryColor: result.business.secondary_color || '#FFFFFF',
          minAdvanceHours: result.business.min_advance_hours || 1,
        });
      }
    } catch (err) {
      setError('No se pudo cargar la configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveColors = async () => {
    if (!business) return;
    setIsSaving(true);
    try {
      await onboardingApi.step2UpdateBrand(business.id, {
        primary_color: formData.primaryColor,
        secondary_color: formData.secondaryColor,
      });
      setSuccess('Colores actualizados correctamente');
      loadBusiness();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar colores');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveAdvance = async () => {
    if (!business) return;
    setIsSaving(true);
    try {
      await onboardingApi.step5UpdateAgenda(business.id, {
        min_advance_hours: formData.minAdvanceHours,
        email_provider: business.email_provider,
        google_calendar_enabled: business.google_calendar_enabled,
      });
      setSuccess('Configuración de agenda actualizada');
      loadBusiness();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!business) {
    return (
      <Alert variant="error">
        No hay negocio configurado. Completa el onboarding primero.
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      {error && (
        <Alert variant="error" className="mb-4">
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" className="mb-4">
          {success}
        </Alert>
      )}

      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg">Información del negocio</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre
            </label>
            <input
              type="text"
              disabled
              value={business.name}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Rubro
            </label>
            <input
              type="text"
              disabled
              value={business.rubro}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Slug (URL pública)
            </label>
            <input
              type="text"
              disabled
              value={business.slug}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <p className="text-xs text-gray-500">
            Para cambiar estos datos, contacta al soporte.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg">Marca</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color primario
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryColor: e.target.value,
                    })
                  }
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      primaryColor: e.target.value,
                    })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Color secundario
              </label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      secondaryColor: e.target.value,
                    })
                  }
                  className="h-10 w-20 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      secondaryColor: e.target.value,
                    })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          </div>
          <Button
            onClick={handleSaveColors}
            isLoading={isSaving}
            className="w-full"
          >
            Guardar colores
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg">Agenda</h3>
          <Input
            label="Horas mínimas de anticipación"
            type="number"
            min="0"
            value={formData.minAdvanceHours}
            onChange={(e) =>
              setFormData({
                ...formData,
                minAdvanceHours: parseInt(e.target.value),
              })
            }
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proveedor de email
            </label>
            <input
              type="text"
              disabled
              value={business.email_provider === 'resend' ? 'Resend' : 'SMTP'}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
            />
          </div>
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="google_calendar"
              disabled
              checked={business.google_calendar_enabled}
            />
            <label htmlFor="google_calendar" className="text-sm text-gray-700">
              Google Calendar habilitado
            </label>
          </div>
          <Button
            onClick={handleSaveAdvance}
            isLoading={isSaving}
            className="w-full"
          >
            Guardar configuración de agenda
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
