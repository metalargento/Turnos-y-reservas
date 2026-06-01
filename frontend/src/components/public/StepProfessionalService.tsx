import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Button, Card } from '../ui';
import type { PublicProfessionalItem, PublicServiceItem } from '../../types';

interface Props {
  professionals: PublicProfessionalItem[];
  selectedProfessional: PublicProfessionalItem | null;
  selectedService: PublicServiceItem | null;
  onSelectProfessional: (prof: PublicProfessionalItem) => void;
  onSelectService: (service: PublicServiceItem) => void;
  onContinue: () => void;
}

export function StepProfessionalService({
  professionals,
  selectedProfessional,
  selectedService,
  onSelectProfessional,
  onSelectService,
  onContinue,
}: Props) {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-6">
          Elige un profesional
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {professionals.map((prof) => (
            <Card
              key={prof.id}
              className={`cursor-pointer transition-all ${
                selectedProfessional?.id === prof.id
                  ? 'border-2 border-black bg-black/5'
                  : 'border border-gray-300 hover:border-gray-400'
              }`}
              onClick={() => onSelectProfessional(prof)}
            >
              <div className="p-4">
                {prof.avatar_url && (
                  <img
                    src={prof.avatar_url}
                    alt={prof.display_name}
                    className="w-16 h-16 rounded-lg object-cover mb-3"
                  />
                )}
                <h3 className="font-semibold text-gray-900">{prof.display_name}</h3>
                {prof.bio && (
                  <p className="text-sm text-gray-600 mt-2">{prof.bio}</p>
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>

      {selectedProfessional && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Elige un servicio
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {selectedProfessional.services.map((service) => (
              <Card
                key={service.id}
                className={`cursor-pointer transition-all ${
                  selectedService?.id === service.id
                    ? 'border-2 border-black bg-black/5'
                    : 'border border-gray-300 hover:border-gray-400'
                }`}
                onClick={() => onSelectService(service)}
              >
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <div className="mt-3 flex justify-between text-sm text-gray-600">
                    <span>{service.duration_minutes} min</span>
                    {service.price && (
                      <span className="font-medium text-gray-900">
                        ${service.price.toLocaleString('es-AR')}
                      </span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center pt-4 border-t border-gray-200">
        <Button
          variant="outline"
          onClick={() => slug && navigate(`/cancel/${slug}`)}
        >
          ¿Cancelar una reserva?
        </Button>
        <Button
          onClick={onContinue}
          disabled={!selectedProfessional || !selectedService}
        >
          Continuar
        </Button>
      </div>
    </div>
  );
}
