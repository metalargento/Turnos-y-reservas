import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, Alert } from '../components/ui';
import { servicesApi } from '../api/services';
import { useBusinessContext } from '../contexts/BusinessContext';
import type { Service, ServiceCreateRequest } from '../types';

export function ServicesPage() {
  const { activeBusiness, isLoading: businessLoading } = useBusinessContext();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<ServiceCreateRequest>({
    name: '',
    duration_minutes: 30,
    price: 0,
  });

  useEffect(() => {
    if (!activeBusiness) return;
    loadServices();
  }, [activeBusiness?.id]);

  const loadServices = async () => {
    if (!activeBusiness) return;
    setIsLoading(true);
    try {
      const result = await servicesApi.list(activeBusiness.id);
      setServices(result.data.services);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar servicios');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;

    try {
      if (editingId) {
        await servicesApi.update(editingId, formData);
      } else {
        await servicesApi.create(activeBusiness.id, formData);
      }
      setFormData({ name: '', duration_minutes: 30, price: 0 });
      setEditingId(null);
      setShowForm(false);
      loadServices();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar servicio');
    }
  };

  const handleDelete = async (serviceId: string) => {
    if (!confirm('¿Estás seguro de que querés desactivar este servicio?')) return;
    try {
      await servicesApi.deactivate(serviceId);
      loadServices();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al desactivar servicio');
    }
  };

  if (businessLoading || isLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Servicios</h1>
        <Button onClick={() => setShowForm(true)}>+ Nuevo servicio</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {showForm && (
        <Card>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg">
              {editingId ? 'Editar servicio' : 'Nuevo servicio'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre del servicio"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <Input
                label="Duración (minutos)"
                type="number"
                value={formData.duration_minutes}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duration_minutes: parseInt(e.target.value),
                  })
                }
                min="15"
                max="480"
              />
              <Input
                label="Precio (opcional)"
                type="number"
                value={formData.price || 0}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value),
                  })
                }
              />
              <Input
                label="Descripción (opcional)"
                value={formData.description || ''}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="flex-1"
                >
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ name: '', duration_minutes: 30, price: 0 });
                  }}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4">
        {services.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No hay servicios aún. Crea tu primer servicio.
            </CardContent>
          </Card>
        ) : (
          services.map((service) => (
            <Card key={service.id}>
              <CardContent className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{service.name}</h3>
                  <p className="text-sm text-gray-600">
                    {service.duration_minutes} min · ${service.price || 'Sin precio'}
                  </p>
                  {service.description && (
                    <p className="text-sm text-gray-500 mt-1">
                      {service.description}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormData(service);
                      setEditingId(service.id);
                      setShowForm(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(service.id)}
                  >
                    Eliminar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
