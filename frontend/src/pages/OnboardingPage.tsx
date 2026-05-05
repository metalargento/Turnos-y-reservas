import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import { Button, Input, Card, CardContent, Alert, Stepper } from '../components/ui';
import { onboardingApi } from '../api/onboarding';
import { useAuth } from '../contexts/AuthContext';
import type {
  BusinessStepRequest,
  BrandStepRequest,
  BranchStepRequest,
  ServicesStepRequest,
  AgendaStepRequest,
} from '../types';

const STEPS = ['Negocio', 'Marca', 'Sucursal', 'Servicios', 'Agenda'];

interface Step1Data extends BusinessStepRequest {}
interface Step2Data extends BrandStepRequest {}
interface Step3Data extends BranchStepRequest {}
interface Step4Data extends ServicesStepRequest {}
interface Step5Data extends AgendaStepRequest {}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const step1Form = useForm<Step1Data>();
  const step2Form = useForm<Step2Data>({
    defaultValues: { primary_color: '#000000', secondary_color: '#FFFFFF' },
  });
  const step3Form = useForm<Step3Data>();
  const step4Form = useForm<Step4Data>({
    defaultValues: { services: [{ name: '', duration_minutes: 30, price: 0 }] },
  });
  const step5Form = useForm<Step5Data>({
    defaultValues: { min_advance_hours: 1, email_provider: 'resend', google_calendar_enabled: false },
  });

  const {
    fields: serviceFields,
    append: appendService,
    remove: removeService,
  } = useFieldArray({
    control: step4Form.control,
    name: 'services',
  });

  useEffect(() => {
    if (serviceFields.length === 0) {
      appendService({ name: '', duration_minutes: 30, price: 0 });
    }
  }, []);

  const handleStep1 = async (data: Step1Data) => {
    setError('');
    setIsLoading(true);
    try {
      const result = await onboardingApi.step1CreateBusiness(data);
      setBusinessId(result.business_id);
      if (result.access_token) {
        localStorage.setItem('token', result.access_token);
      }
      setCurrentStep(1);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear negocio');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep2 = async (data: Step2Data) => {
    if (!businessId) return;
    setError('');
    setIsLoading(true);
    try {
      await onboardingApi.step2UpdateBrand(businessId, data);
      setCurrentStep(2);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al actualizar marca');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep3 = async (data: Step3Data) => {
    if (!businessId) return;
    setError('');
    setIsLoading(true);
    try {
      await onboardingApi.step3CreateBranch(businessId, data);
      setCurrentStep(3);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear sucursal');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep4 = async (data: Step4Data) => {
    if (!businessId) return;
    setError('');
    setIsLoading(true);
    try {
      await onboardingApi.step4CreateServices(businessId, data);
      setCurrentStep(4);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al crear servicios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep5 = async (data: Step5Data) => {
    if (!businessId) return;
    setError('');
    setIsLoading(true);
    try {
      await onboardingApi.step5UpdateAgenda(businessId, data);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al configurar agenda');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <Stepper steps={STEPS} currentStep={currentStep} />

      {error && <Alert variant="error" className="mb-6">{error}</Alert>}

      {currentStep === 0 && (
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Datos de tu negocio</h2>
              <p className="text-gray-500">Empezemos con la información básica</p>
            </div>
            <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-4">
              <Input
                label="Nombre del negocio"
                placeholder="Peluquería Juan"
                {...step1Form.register('name', { required: 'Requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
                error={step1Form.formState.errors.name?.message}
              />
              <Input
                label="Rubro"
                placeholder="Peluquería, Consultorio, Gimnasio..."
                {...step1Form.register('rubro', { required: 'Requerido', minLength: { value: 2, message: 'Mínimo 2 caracteres' } })}
                error={step1Form.formState.errors.rubro?.message}
              />
              <Input
                label="Descripción (opcional)"
                placeholder="Breve descripción de tu negocio"
                {...step1Form.register('description')}
              />
              <Button type="submit" className="w-full" isLoading={isLoading}>
                Continuar
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 1 && (
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Marca del negocio</h2>
              <p className="text-gray-500">Personalizá cómo se verá tu negocio</p>
            </div>
            <form onSubmit={step2Form.handleSubmit(handleStep2)} className="space-y-4">
              <Input
                label="URL del logo (opcional)"
                placeholder="https://ejemplo.com/logo.png"
                {...step2Form.register('logo_url')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Color primario"
                  type="color"
                  {...step2Form.register('primary_color')}
                  className="h-12"
                />
                <Input
                  label="Color secundario"
                  type="color"
                  {...step2Form.register('secondary_color')}
                  className="h-12"
                />
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(0)} className="flex-1">
                  Volver
                </Button>
                <Button type="submit" className="flex-1" isLoading={isLoading}>
                  Continuar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 2 && (
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tu primera sucursal</h2>
              <p className="text-gray-500">Agregá la ubicación principal</p>
            </div>
            <form onSubmit={step3Form.handleSubmit(handleStep3)} className="space-y-4">
              <Input
                label="Nombre de la sucursal"
                placeholder="Casa central"
                {...step3Form.register('branch_name', { required: 'Requerido' })}
                error={step3Form.formState.errors.branch_name?.message}
              />
              <Input
                label="Dirección (opcional)"
                placeholder="Av. Libertador 1234"
                {...step3Form.register('address')}
              />
              <Input
                label="Teléfono (opcional)"
                placeholder="+54 11 1234-5678"
                {...step3Form.register('phone')}
              />
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(1)} className="flex-1">
                  Volver
                </Button>
                <Button type="submit" className="flex-1" isLoading={isLoading}>
                  Continuar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 3 && (
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Servicios</h2>
              <p className="text-gray-500">¿Qué servicios ofrecés?</p>
            </div>
            <form onSubmit={step4Form.handleSubmit(handleStep4)} className="space-y-4">
              {serviceFields.map((field, index) => (
                <div key={field.id} className="p-4 bg-gray-50 rounded-lg space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Servicio {index + 1}</span>
                    {serviceFields.length > 1 && (
                      <button type="button" onClick={() => removeService(index)} className="text-red-500 text-sm">
                        Eliminar
                      </button>
                    )}
                  </div>
                  <Input
                    placeholder="Nombre del servicio"
                    {...step4Form.register(`services.${index}.name` as const, { required: 'Requerido' })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      type="number"
                      placeholder="Duración (min)"
                      {...step4Form.register(`services.${index}.duration_minutes` as const, { valueAsNumber: true, required: 'Requerido', min: 15 })}
                    />
                    <Input
                      type="number"
                      placeholder="Precio"
                      step="0.01"
                      {...step4Form.register(`services.${index}.price` as const, { valueAsNumber: true })}
                    />
                  </div>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                onClick={() => appendService({ name: '', duration_minutes: 30, price: 0 })}
                className="w-full"
              >
                + Agregar servicio
              </Button>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(2)} className="flex-1">
                  Volver
                </Button>
                <Button type="submit" className="flex-1" isLoading={isLoading}>
                  Continuar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {currentStep === 4 && (
        <Card>
          <CardContent className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Configuración final</h2>
              <p className="text-gray-500">Últimos ajustes para activar tu negocio</p>
            </div>
            <form onSubmit={step5Form.handleSubmit(handleStep5)} className="space-y-4">
              <Input
                label="Horas mínimas de anticipación"
                type="number"
                {...step5Form.register('min_advance_hours', { valueAsNumber: true, required: true })}
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor de email</label>
                <select
                  {...step5Form.register('email_provider')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="resend">Resend (recomendado)</option>
                  <option value="smtp">SMTP propio</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" {...step5Form.register('google_calendar_enabled')} />
                <label className="text-sm text-gray-700">Activar Google Calendar</label>
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setCurrentStep(3)} className="flex-1">
                  Volver
                </Button>
                <Button type="submit" className="flex-1" isLoading={isLoading}>
                  Completar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
