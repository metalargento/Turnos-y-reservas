import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, useFieldArray, useWatch } from 'react-hook-form';
import { Button, Input, Card, CardContent, Alert, Stepper, ImageUploader } from '../components/ui';
import { onboardingApi } from '../api/onboarding';
import { uploadApi } from '../api/upload';
import { useAuth } from '../contexts/AuthContext';
import { branchesApi } from '../api/branches';
import { servicesApi } from '../api/services';
import type {
  BusinessStepRequest,
  BrandStepRequest,
  BranchStepRequest,
  ServicesStepRequest,
  AgendaStepRequest,
} from '../types';

const STEPS = ['Negocio', 'Marca', 'Sucursal', 'Servicios', 'Agenda'];
const STEP_KEYS = ['step_1_business', 'step_2_brand', 'step_3_branch', 'step_4_services', 'step_5_agenda'];

interface Step1Data extends BusinessStepRequest {}
interface Step2Data extends BrandStepRequest {}
interface Step3Data extends BranchStepRequest {}
interface Step4Data extends ServicesStepRequest {}
interface Step5Data extends AgendaStepRequest {}

export function OnboardingPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [businessId, setBusinessId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);

  useEffect(() => {
    loadExistingBusiness();
  }, []);

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

  const loadExistingBusiness = async () => {
    try {
      const result = await onboardingApi.getMyBusiness();
      if (result.has_business && result.business) {
        setBusinessId(result.business.id);
        const progress = await onboardingApi.getProgress(result.business.id);
        setCompletedSteps(progress.steps_completed);

        const nextStepIndex = STEP_KEYS.findIndex(key => !progress.steps_completed.includes(key));

        if (progress.onboarding_completed) {
          navigate('/dashboard');
          return;
        }

        // Prefill forms with existing business data
        step1Form.reset({
          name: result.business.name,
          rubro: result.business.rubro,
          description: result.business.description,
        });

        step2Form.reset({
          logo_url: result.business.logo_url,
          primary_color: result.business.primary_color,
          secondary_color: result.business.secondary_color,
        });

        step5Form.reset({
          min_advance_hours: result.business.min_advance_hours,
          email_provider: result.business.email_provider || 'resend',
          google_calendar_enabled: result.business.google_calendar_enabled || false,
        });

        // Load branches for step 3
        if (progress.steps_completed.includes('step_3_branch')) {
          try {
            const branchesResult = await branchesApi.list(result.business.id);
            if (branchesResult.data.branches.length > 0) {
              const branch = branchesResult.data.branches[0];
              step3Form.reset({
                branch_name: branch.name,
                address: branch.address,
                phone: branch.phone,
              });
            }
          } catch {
            // If error loading branches, continue
          }
        }

        // Load services for step 4
        if (progress.steps_completed.includes('step_4_services')) {
          try {
            const servicesResult = await servicesApi.list(result.business.id);
            if (servicesResult.data.services.length > 0) {
              step4Form.reset({
                services: servicesResult.data.services.map(s => ({
                  name: s.name,
                  duration_minutes: s.duration_minutes,
                  price: s.price || 0,
                })),
              });
            }
          } catch {
            // If error loading services, continue
          }
        }

        if (nextStepIndex >= 0) {
          setCurrentStep(nextStepIndex);
        }
      }
    } catch {
      // No business yet, start from step 0
    }
  };

  useEffect(() => {
    if (serviceFields.length === 0) {
      appendService({ name: '', duration_minutes: 30, price: 0 });
    }
  }, [serviceFields, appendService]);

  const handleStep1 = async (data: Step1Data) => {
    setError('');
    setIsLoading(true);
    try {
      // Si el paso ya está completo, solo avanzar sin hacer llamada de creación
      if (completedSteps.includes('step_1_business')) {
        setCurrentStep(1);
        return;
      }

      const result = await onboardingApi.step1CreateBusiness(data);
      setBusinessId((result as any).business_id || result.id);
      setCompletedSteps(prev => [...prev, 'step_1_business']);
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
      setCompletedSteps(prev => {
        if (!prev.includes('step_2_brand')) {
          return [...prev, 'step_2_brand'];
        }
        return prev;
      });
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
      // Si el paso ya está completo, solo avanzar sin hacer llamada de creación
      if (completedSteps.includes('step_3_branch')) {
        setCurrentStep(3);
        return;
      }

      await onboardingApi.step3CreateBranch(businessId, data);
      setCompletedSteps(prev => [...prev, 'step_3_branch']);
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
      // Si el paso ya está completo, solo avanzar sin hacer llamada de creación
      if (completedSteps.includes('step_4_services')) {
        setCurrentStep(4);
        return;
      }

      await onboardingApi.step4CreateServices(businessId, data);
      setCompletedSteps(prev => [...prev, 'step_4_services']);
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
      setCompletedSteps(prev => [...prev, 'step_5_agenda']);
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
              {businessId && (
                <ImageUploader
                  label="Logo del negocio (opcional)"
                  value={step2Form.watch('logo_url')}
                  onChange={(url) => step2Form.setValue('logo_url', url)}
                  onUpload={async (file) => {
                    setLogoUploading(true);
                    try {
                      const url = await uploadApi.uploadLogo(businessId, file);
                      return url;
                    } finally {
                      setLogoUploading(false);
                    }
                  }}
                  isLoading={logoUploading}
                />
              )}
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
                      label="Duración (min)"
                      type="number"
                      placeholder="30"
                      {...step4Form.register(`services.${index}.duration_minutes` as const, { valueAsNumber: true, required: 'Requerido', min: 15 })}
                    />
                    <Input
                      label="Precio"
                      type="number"
                      placeholder="0"
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
            <Step5Form
              form={step5Form}
              isLoading={isLoading}
              onBack={() => setCurrentStep(3)}
              onSubmit={handleStep5}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface Step5FormProps {
  form: any;
  isLoading: boolean;
  onBack: () => void;
  onSubmit: (data: Step5Data) => void;
}

function Step5Form({ form, isLoading, onBack, onSubmit }: Step5FormProps) {
  const emailProvider = useWatch({ control: form.control, name: 'email_provider' });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Horas mínimas de anticipación"
        type="number"
        {...form.register('min_advance_hours', { valueAsNumber: true, required: true })}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Proveedor de email</label>
        <select
          {...form.register('email_provider')}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
        >
          <option value="resend">Resend (recomendado)</option>
          <option value="smtp">SMTP propio</option>
        </select>
      </div>

      {emailProvider === 'smtp' && (
        <div className="bg-blue-50 p-4 rounded-lg space-y-4 border border-blue-200">
          <Input
            label="Host SMTP"
            placeholder="smtp.gmail.com"
            {...form.register('smtp_host')}
          />
          <Input
            label="Puerto SMTP"
            type="number"
            placeholder="587"
            {...form.register('smtp_port', { valueAsNumber: true })}
          />
          <Input
            label="Usuario SMTP"
            placeholder="tu@email.com"
            {...form.register('smtp_user')}
          />
          <Input
            label="Contraseña SMTP"
            type="password"
            placeholder="••••••••"
            {...form.register('smtp_password')}
          />
        </div>
      )}

      <div className="flex items-center gap-2">
        <input type="checkbox" id="google_calendar" {...form.register('google_calendar_enabled')} />
        <label htmlFor="google_calendar" className="text-sm text-gray-700">
          Activar Google Calendar (opcional)
        </label>
      </div>

      <div className="flex gap-4">
        <Button type="button" variant="outline" onClick={onBack} className="flex-1">
          Volver
        </Button>
        <Button type="submit" className="flex-1" isLoading={isLoading}>
          Completar
        </Button>
      </div>
    </form>
  );
}
