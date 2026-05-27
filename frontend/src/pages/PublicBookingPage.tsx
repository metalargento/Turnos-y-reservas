import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Alert, Button, Card, Stepper } from '../components/ui';
import { publicBookingsApi } from '../api/publicBookings';
import type {
  PublicBusinessInfo,
  PublicProfessionalItem,
  PublicServiceItem,
  TimeSlot,
  BusinessInfoResponse,
} from '../types';

// Componentes de pasos (se crearán después)
import { StepProfessionalService } from '../components/public/StepProfessionalService';
import { StepCalendar } from '../components/public/StepCalendar';
import { StepTimeSlots } from '../components/public/StepTimeSlots';
import { StepClientForm } from '../components/public/StepClientForm';
import { BookingConfirmation } from '../components/public/BookingConfirmation';

export interface BookingWizardState {
  professional: PublicProfessionalItem | null;
  service: PublicServiceItem | null;
  selectedDate: string | null; // YYYY-MM-DD
  selectedSlot: TimeSlot | null;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientNotes: string;
}

export function PublicBookingPage() {
  const { slug } = useParams<{ slug: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [businessInfo, setBusinessInfo] = useState<BusinessInfoResponse | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [bookingConfirmed, setBookingConfirmed] = useState(false);
  const [bookingId, setBookingId] = useState('');

  const [wizardState, setWizardState] = useState<BookingWizardState>({
    professional: null,
    service: null,
    selectedDate: null,
    selectedSlot: null,
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientNotes: '',
  });

  // Cargar información del negocio
  useEffect(() => {
    if (!slug) return;

    const loadBusinessInfo = async () => {
      try {
        setIsLoading(true);
        const response = await publicBookingsApi.getBusinessInfo(slug);
        setBusinessInfo(response.data);
        setError('');
      } catch (err: any) {
        setError(
          err.response?.status === 404
            ? 'Este negocio no existe o no está disponible'
            : 'Error al cargar la información del negocio'
        );
        setBusinessInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    loadBusinessInfo();
  }, [slug]);

  const handleResetWizard = () => {
    setWizardState({
      professional: null,
      service: null,
      selectedDate: null,
      selectedSlot: null,
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      clientNotes: '',
    });
    setCurrentStep(0);
    setBookingConfirmed(false);
    setBookingId('');
  };

  const handleConfirmBooking = (id: string) => {
    setBookingId(id);
    setBookingConfirmed(true);
  };

  const handleGoToStep = (step: number) => {
    setCurrentStep(step);
  };

  // Error loading business
  if (!isLoading && error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <div className="px-6 py-8 text-center">
            <Alert variant="error" className="mb-4">
              {error}
            </Alert>
            <p className="text-gray-600 text-sm">
              Si crees que es un error, contacta al administrador del negocio.
            </p>
          </div>
        </Card>
      </div>
    );
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="mb-4">Cargando...</div>
        </div>
      </div>
    );
  }

  if (!businessInfo) {
    return null;
  }

  const { business, professionals } = businessInfo;

  // Pantalla de confirmación
  if (bookingConfirmed) {
    return (
      <BookingConfirmation
        bookingId={bookingId}
        onBookAnother={handleResetWizard}
        business={business}
        wizardState={wizardState}
      />
    );
  }

  // Header del widget
  const headerContent = (
    <div className="bg-white border-b border-gray-200 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          {business.logo_url && (
            <img
              src={business.logo_url}
              alt={business.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{business.name}</h1>
            {business.rubro && (
              <p className="text-sm text-gray-500">{business.rubro}</p>
            )}
          </div>
        </div>
        <Stepper
          steps={['Profesional y servicio', 'Fecha', 'Hora', 'Tus datos']}
          currentStep={currentStep}
        />
      </div>
    </div>
  );

  // Contenido del paso actual
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <StepProfessionalService
            professionals={professionals}
            selectedProfessional={wizardState.professional}
            selectedService={wizardState.service}
            onSelectProfessional={(prof) =>
              setWizardState({ ...wizardState, professional: prof, service: null })
            }
            onSelectService={(service) =>
              setWizardState({ ...wizardState, service })
            }
            onContinue={() => setCurrentStep(1)}
          />
        );
      case 1:
        if (!wizardState.professional || !wizardState.service) {
          return null;
        }
        return (
          <StepCalendar
            slug={business.slug}
            professional={wizardState.professional}
            service={wizardState.service}
            selectedDate={wizardState.selectedDate}
            onSelectDate={(date) =>
              setWizardState({ ...wizardState, selectedDate: date, selectedSlot: null })
            }
            onContinue={() => setCurrentStep(2)}
            onBack={() => setCurrentStep(0)}
          />
        );
      case 2:
        if (!wizardState.professional || !wizardState.service || !wizardState.selectedDate) {
          return null;
        }
        return (
          <StepTimeSlots
            slug={business.slug}
            professional={wizardState.professional}
            service={wizardState.service}
            selectedDate={wizardState.selectedDate}
            selectedSlot={wizardState.selectedSlot}
            onSelectSlot={(slot) =>
              setWizardState({ ...wizardState, selectedSlot: slot })
            }
            onContinue={() => setCurrentStep(3)}
            onBack={() => setCurrentStep(1)}
          />
        );
      case 3:
        if (
          !wizardState.professional ||
          !wizardState.service ||
          !wizardState.selectedDate ||
          !wizardState.selectedSlot
        ) {
          return null;
        }
        return (
          <StepClientForm
            slug={business.slug}
            wizardState={wizardState}
            onStateChange={(state) => setWizardState(state)}
            onConfirmBooking={handleConfirmBooking}
            onBack={() => setCurrentStep(2)}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {headerContent}
      <div className="max-w-4xl mx-auto py-8 px-4">
        {renderStepContent()}
      </div>
    </div>
  );
}
