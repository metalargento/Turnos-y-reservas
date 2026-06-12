import React, { useState } from 'react';
import { Card, CardContent, Button, Input, Alert, ImageUploader } from '../components/ui';
import { GmailConnect } from '../components/GmailConnect';
import { useBusinessContext } from '../contexts/BusinessContext';
import { onboardingApi } from '../api/onboarding';
import { businessApi } from '../api/business';
import { uploadApi } from '../api/upload';

export function SettingsPage() {
  const { activeBusiness, isLoading: businessLoading, refreshBusiness } = useBusinessContext();
  const [isLoading, setIsLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
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

  // Sección 3: Contacto
  const [contactForm, setContactForm] = useState({
    phone: '',
    whatsapp: '',
    address: '',
    instagram_url: '',
    facebook_url: '',
  });
  const [editingContact, setEditingContact] = useState(false);

  // Sección 4: Agenda
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
      setContactForm({
        phone: activeBusiness.phone || '',
        whatsapp: activeBusiness.whatsapp || '',
        address: activeBusiness.address || '',
        instagram_url: activeBusiness.instagram_url || '',
        facebook_url: activeBusiness.facebook_url || '',
      });
      setAgendaForm({
        min_advance_hours: activeBusiness.min_advance_hours || 1,
        email_provider: 'resend',
        smtp_host: '',
        smtp_port: '',
        smtp_user: '',
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

  const handleSaveContact = async () => {
    if (!activeBusiness) return;
    setIsLoading(true);
    try {
      await businessApi.update(activeBusiness.id, {
        phone: contactForm.phone || undefined,
        whatsapp: contactForm.whatsapp || undefined,
        address: contactForm.address || undefined,
        instagram_url: contactForm.instagram_url || undefined,
        facebook_url: contactForm.facebook_url || undefined,
      });
      setSuccess('Información de contacto actualizada correctamente');
      setEditingContact(false);
      setError('');
      await refreshBusiness();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar contacto');
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
        email_provider: 'resend',
        google_calendar_enabled: agendaForm.google_calendar_enabled,
      };

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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Configuración</h1>

      {error && <Alert variant="error">{error}</Alert>}
      {success && <Alert variant="success">{success}</Alert>}

      {/* Sección 1: Información básica */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg dark:text-neutral-100">Información del negocio</h3>

          {!editingBasic ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Nombre</label>
                <p className="text-gray-900 dark:text-neutral-100">{activeBusiness.name}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Rubro</label>
                <p className="text-gray-900 dark:text-neutral-100">{activeBusiness.rubro}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Descripción</label>
                <p className="text-gray-900 dark:text-neutral-100">{activeBusiness.description || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">URL pública</label>
                <p className="text-gray-900 dark:text-neutral-100 font-mono text-sm">{activeBusiness.slug}</p>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-1">Descripción</label>
                <textarea
                  value={basicForm.description}
                  onChange={(e) => setBasicForm({ ...basicForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-black dark:bg-neutral-800 dark:text-neutral-100"
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
          <h3 className="font-semibold text-lg dark:text-neutral-100">Marca</h3>

          {activeBusiness && (
            <ImageUploader
              label="Logo"
              value={brandForm.logo_url}
              onChange={(url) => setBrandForm({ ...brandForm, logo_url: url })}
              onUpload={async (file) => {
                setLogoUploading(true);
                try {
                  const url = await uploadApi.uploadLogo(activeBusiness.id, file);
                  return url;
                } finally {
                  setLogoUploading(false);
                }
              }}
              isLoading={logoUploading}
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">Color primario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={brandForm.primary_color}
                  onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })}
                  className="h-10 w-16 rounded border border-gray-300 dark:border-neutral-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={brandForm.primary_color}
                  onChange={(e) => setBrandForm({ ...brandForm, primary_color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg text-sm dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-neutral-200 mb-2">Color secundario</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={brandForm.secondary_color}
                  onChange={(e) => setBrandForm({ ...brandForm, secondary_color: e.target.value })}
                  className="h-10 w-16 rounded border border-gray-300 dark:border-neutral-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={brandForm.secondary_color}
                  onChange={(e) => setBrandForm({ ...brandForm, secondary_color: e.target.value })}
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-neutral-600 rounded-lg text-sm dark:bg-neutral-800 dark:text-neutral-100"
                />
              </div>
            </div>
          </div>

          {/* Preview de colores */}
          <div className="flex gap-2 h-12 rounded-lg overflow-hidden border border-gray-200 dark:border-neutral-600">
            <div style={{ backgroundColor: brandForm.primary_color, flex: 1 }} title="Color primario" />
            <div style={{ backgroundColor: brandForm.secondary_color, flex: 1 }} title="Color secundario" />
          </div>

          <Button onClick={handleSaveBrand} isLoading={isLoading} className="w-full">
            Guardar marca
          </Button>
        </CardContent>
      </Card>

      {/* Sección 3: Contacto */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg dark:text-neutral-100">Información de contacto</h3>

          {!editingContact ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Teléfono</label>
                <p className="text-gray-900 dark:text-neutral-100">{contactForm.phone || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">WhatsApp</label>
                <p className="text-gray-900 dark:text-neutral-100">{contactForm.whatsapp || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Dirección</label>
                <p className="text-gray-900 dark:text-neutral-100">{contactForm.address || '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Instagram</label>
                <p className="text-gray-900 dark:text-neutral-100">{contactForm.instagram_url ? (
                  <a href={contactForm.instagram_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Ver perfil
                  </a>
                ) : '—'}</p>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Facebook</label>
                <p className="text-gray-900 dark:text-neutral-100">{contactForm.facebook_url ? (
                  <a href={contactForm.facebook_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Ver perfil
                  </a>
                ) : '—'}</p>
              </div>
              <Button size="sm" onClick={() => setEditingContact(true)} className="w-full">
                Editar contacto
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Input
                label="Teléfono"
                placeholder="+54 9 11 1234-5678"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
              />
              <Input
                label="WhatsApp"
                placeholder="+54 9 11 1234-5678"
                value={contactForm.whatsapp}
                onChange={(e) => setContactForm({ ...contactForm, whatsapp: e.target.value })}
              />
              <Input
                label="Dirección"
                placeholder="Avenida Principal 123, CABA"
                value={contactForm.address}
                onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
              />
              <Input
                label="URL Instagram"
                placeholder="https://instagram.com/tuusuario"
                value={contactForm.instagram_url}
                onChange={(e) => setContactForm({ ...contactForm, instagram_url: e.target.value })}
              />
              <Input
                label="URL Facebook"
                placeholder="https://facebook.com/tuperfil"
                value={contactForm.facebook_url}
                onChange={(e) => setContactForm({ ...contactForm, facebook_url: e.target.value })}
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleSaveContact} isLoading={isLoading} className="flex-1">
                  Guardar
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditingContact(false)}
                  className="flex-1"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección 4: Email y notificaciones */}
      <Card>
        <CardContent className="space-y-6">
          <h3 className="font-semibold text-lg dark:text-neutral-100">Email y notificaciones</h3>

          {/* Subsección: Emails de confirmación */}
          <div className="border-b pb-4 dark:border-neutral-700">
            <h4 className="font-medium text-gray-700 dark:text-neutral-200 mb-3">Emails de confirmación</h4>
            {activeBusiness?.google_email ? (
              <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300 mb-3">
                ✅ Se envían desde: <strong>{activeBusiness.google_email}</strong>
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-950 p-3 rounded-lg border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 mb-3">
                📧 Se envían a través de Resend (proveedor por defecto)
              </div>
            )}
            <GmailConnect
              businessId={activeBusiness?.id || ''}
              googleEmail={activeBusiness?.google_email}
              onConnectSuccess={refreshBusiness}
            />
          </div>

          {/* Subsección: Agenda */}
          <div>
            <h4 className="font-medium text-gray-700 dark:text-neutral-200 mb-3">Configuración de agenda</h4>
            <Input
              label="Horas mínimas de anticipación"
              type="number"
              min="0"
              max="72"
              value={agendaForm.min_advance_hours}
              onChange={(e) => setAgendaForm({ ...agendaForm, min_advance_hours: parseInt(e.target.value) })}
            />
            
            <div className="flex items-center gap-2 mt-4">
              <input
                type="checkbox"
                id="google_calendar"
                checked={agendaForm.google_calendar_enabled}
                onChange={(e) => setAgendaForm({ ...agendaForm, google_calendar_enabled: e.target.checked })}
                className="rounded border-gray-300 dark:border-neutral-600"
              />
              <label htmlFor="google_calendar" className="text-sm text-gray-700 dark:text-neutral-200">
                Integración con Google Calendar habilitada
              </label>
            </div>

            <Button onClick={handleSaveAgenda} isLoading={isLoading} className="w-full mt-4">
              Guardar configuración
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sección 5: Plan */}
      <Card>
        <CardContent className="space-y-4">
          <h3 className="font-semibold text-lg dark:text-neutral-100">Plan y suscripción</h3>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-2">Estado del plan</label>
            {getPlanStatusBadge()}
          </div>
          {activeBusiness.plan_expires_at && (
            <div>
              <label className="block text-xs font-medium text-gray-500 dark:text-neutral-400 mb-1">Vence el</label>
              <p className="text-gray-900 dark:text-neutral-100">
                {new Date(activeBusiness.plan_expires_at).toLocaleDateString('es-AR')}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
