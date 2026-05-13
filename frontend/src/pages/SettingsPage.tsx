import React, { useState } from 'react';
import { Card, CardContent, Button, Input, Alert } from '../components/ui';
import { useBusinessContext } from '../contexts/BusinessContext';
import { onboardingApi } from '../api/onboarding';
import { businessApi } from '../api/business';
import type { Business } from '../types';

export function SettingsPage() {
  const { activeBusiness, isLoading: businessLoading, refreshBusiness } = useBusinessContext();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Sección 1: Información básica
  const [basicForm, setBasicForm] = useState({ name: '', rubro: '', description: '' });
  const [editingBasic, setEditingBasic] = useState(false);

  // Sección 2: Marca
  const [brandForm, setBrandForm] = useState({
    logo_url: '',
    primary_color: '#000000',
    secondary_color: '#FFFFFF',
  });

  // Sección 3: Agenda
  const [agendaForm, setAgendaForm] = useState({
    min_advance_hours: 1,
    email_provider: 'resend' as const,
    smtp_host: '',
    smtp_port: '',
    smtp_user: '',
    smtp_password: '',
    google_calendar_enabled: false,
  });

  // Sincronizar datos cuando activeBusiness cambia
  React.useEffect(() => {
    if (activeBusiness) {
      setBasicForm({
        name: activeBusiness.name || '',
        rubro: activeBusiness.rubro || '',
        description: activeBusiness.description || '',
      });
      setBrandForm({
        logo_url: activeBusiness.logo_url || '',
        primary_color: activeBusiness.primary_color || '#000000',
        secondary_color: activeBusiness.secondary_color || '#FFFFFF',
      });
      setAgendaForm({
        min_advance_hours: activeBusiness.min_advance_hours || 1,
        email_provider: activeBusiness.email_provider || 'resend',
        smtp_host: activeBusiness.smtp_host || '',
        smtp_port: activeBusiness.smtp_port?.toString() || '',
        smtp_user: activeBusiness.smtp_user || '',
        smtp_password: '',
        google_calendar_enabled: activeBusiness.google_calendar_enabled || false,
      });
    }
  }, [activeBusiness]);

  const handleSaveBasic = async () => {
    if (!activeBusiness) return;
    setIsLoading(true);
    try {
      await businessApi.update(activeBusiness.id, {
        name: basicForm.name,
        rubro: basicForm.rubro,
        description: basicForm.description,
      });
      setSuccess('Información actualizada correctamente');
      setEditingBasic(false);
      setError('');
      await refreshBusiness();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar información');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveBrand = async () => {
    if (!activeBusiness) return;
    setIsLoading(true);
    try {
      await onboardingApi.step2UpdateBrand(activeBusiness.id, {
        logo_url: brandForm.logo_url || undefined,
        primary_color: brandForm.primary_color,
        secondary_color: brandForm.secondary_color,
      });
      setSuccess('Marca actualizada correctamente');
      setError('');
      await refreshBusiness();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar marca');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAgenda = async () => {
    if (!activeBusiness) return;
    setIsLoading(true);
    try {
      const agendaData: any = {
        min_advance_hours: agendaForm.min_advance_hours,
        email_provider: agendaForm.email_provider,
        google_calendar_enabled: agendaForm.google_calendar_enabled,
      };

      if (agendaForm.email_provider === 'smtp') {
        agendaData.smtp_host = agendaForm.smtp_host;
        agendaData.smtp_port = agendaForm.smtp_port ? parseInt(agendaForm.smtp_port) : null;
        agendaData.smtp_user = agendaForm.smtp_user;
        agendaData.smtp_password = agendaForm.smtp_password;
      }

      await onboardingApi.step5UpdateAgenda(activeBusiness.id, agendaData);
      setSuccess('Configuración de agenda actualizada');
      setError('');
      await refreshBusiness();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar configuración');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanStatusBadge = () => {
    if (!activeBusiness) return null;
    const statusMap = {
      active: { bg: 'bg-green-100', text: 'text-green-800', label: 'Activo' },
      expired: { bg: 'bg-red-100', text: 'text-red-800', label: 'Expirado' },
      cancelled: { bg: 'bg-gray-100', text: 'text-gray-800', label: 'Cancelado' },
    };
    const status = statusMap[activeBusiness.plan_status] || statusMap.expired;
    return (
      <div className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${status.bg} ${status.text}`}>
        {status.label}
      </div>
    );
  };

  if (businessLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  if (!activeBusiness) {
    return (
      <Alert variant="error">
        No hay negocio configurado. Completa el onboarding primero.
      </Alert>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Sección 1: Información básica */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg">Información del negocio</h3>

          {!editingBasic ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Nombre</label>
                <p className="text-gray-900">{activeBusiness.name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Rubro</label>
                <p className="text-gray-900">{activeBusiness.rubro}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">Descripción</label>
                <p className="text-gray-900">{activeBusiness.description || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-1">URL pública</label>
                <p className="text-gray-900 font-mono text-sm">{activeBusiness.slug}</p>
              </div>
              <Button size="sm" onClick={() => setEditingBasic(true)} className="w-full">
                Editar información
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Nombre"
                value={basicForm.name}
                onChange={(e) => setBasicForm({ ...basicForm, name: e.target.value })}
              />
              <Input
                label="Rubro"
                value={basicForm.rubro}
                onChange={(e) => setBasicForm({ ...basicForm, rubro: e.target.value })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                <textarea
                  value={basicForm.description}
                  onChange={(e) => setBasicForm({ ...basicForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
                  rows={3}
                  placeholder="Descripción de tu negocio..."
                />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveBasic} isLoading={isLoading} className="flex-1">
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingBasic(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección 2: Marca */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg">Marca</h3>

          <Input
            label="Logo URL"
            placeholder="https://example.com/logo.png"
            value={brandForm.logo_url}
            onChange={(e) => setBrandForm({ ...brandForm, logo_url: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color primario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={brandForm.primary_color}
                  onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })}
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={brandForm.primary_color}
                  onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Color secundario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={brandForm.secondary_color}
                  onChange={(e) => setBrandForm({ ...brandForm, secondary_color: e.target.value })}
                  className="h-10 w-16 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={brandForm.secondary_color}
                  onChange={(e) => setBrandForm({ ...brandForm, secondary_color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
              </div>
            </div>
          </div>

          {/* Preview de colores */}
          <div className="flex gap-2 h-12 rounded-lg overflow-hidden border border-gray-200">
            <div style={{ backgroundColor: brandForm.primary_color, flex: 1 }} title="Color primario" />
            <div style={{ backgroundColor: brandForm.secondary_color, flex: 1 }} title="Color secundario" />
          </div>

          <Button onClick={handleSaveBrand} isLoading={isLoading} className="w-full">
            Guardar marca
          </Button>
        </CardContent>
      </Card>

      {/* Sección 3: Agenda y email */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg">Configuración de agenda</h3>

          <Input
            label="Horas mínimas de anticipación"
            type="number"
            min="0"
            max="72"
            value={agendaForm.min_advance_hours}
            onChange={(e) => setAgendaForm({ ...agendaForm, min_advance_hours: parseInt(e.target.value) })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor de email</label>
            <select
              value={agendaForm.email_provider}
              onChange={(e) => setAgendaForm({ ...agendaForm, email_provider: e.target.value as 'resend' | 'smtp' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black"
            >
              <option value="resend">Resend (recomendado)</option>
              <option value="smtp">SMTP propio</option>
            </select>
          </div>

          {agendaForm.email_provider === 'smtp' && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-200">
              <Input
                label="Host SMTP"
                placeholder="smtp.gmail.com"
                value={agendaForm.smtp_host}
                onChange={(e) => setAgendaForm({ ...agendaForm, smtp_host: e.target.value })}
              />
              <Input
                label="Puerto SMTP"
                type="number"
                placeholder="587"
                value={agendaForm.smtp_port}
                onChange={(e) => setAgendaForm({ ...agendaForm, smtp_port: e.target.value })}
              />
              <Input
                label="Usuario SMTP"
                placeholder="tu@email.com"
                value={agendaForm.smtp_user}
                onChange={(e) => setAgendaForm({ ...agendaForm, smtp_user: e.target.value })}
              />
              <Input
                label="Contraseña SMTP"
                type="password"
                placeholder="••••••••"
                value={agendaForm.smtp_password}
                onChange={(e) => setAgendaForm({ ...agendaForm, smtp_password: e.target.value })}
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="google_calendar"
              checked={agendaForm.google_calendar_enabled}
              onChange={(e) => setAgendaForm({ ...agendaForm, google_calendar_enabled: e.target.checked })}
              className="rounded border-gray-300"
            />
            <label htmlFor="google_calendar" className="text-sm text-gray-700">
              Integración con Google Calendar habilitada
            </label>
          </div>

          <Button onClick={handleSaveAgenda} isLoading={isLoading} className="w-full">
            Guardar configuración
          </Button>
        </CardContent>
      </Card>

      {/* Sección 4: Plan */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg">Plan y suscripción</h3>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-2">Estado del plan</label>
            {getPlanStatusBadge()}
          </div>
          {activeBusiness.plan_expires_at && (
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">Vence el</label>
              <p className="text-gray-900">
                {new Date(activeBusiness.plan_expires_at).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
