import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, Alert } from '../components/ui';
import { professionalsApi } from '../api/professionals';
import { servicesApi } from '../api/services';
import { branchesApi } from '../api/branches';
import { useBusinessContext } from '../contexts/BusinessContext';
import type {
  Professional,
  Service,
  Branch,
  ProfessionalCreateRequest,
} from '../types';

export function ProfessionalsPage() {
  const { activeBusiness, isLoading: businessLoading } = useBusinessContext();
  const [professionals, setProfessionals] = useState<Professional[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [selectedServices, setSelectedServices] = useState<Set<string>>(
    new Set()
  );
  const [formData, setFormData] = useState<ProfessionalCreateRequest>({
    display_name: '',
  });

  useEffect(() => {
    if (!activeBusiness) return;
    loadAllData();
  }, [activeBusiness?.id]);

  const loadAllData = async () => {
    if (!activeBusiness) return;
    setIsLoading(true);
    try {
      const [profsResult, servResult, branchResult] = await Promise.all([
        professionalsApi.list(activeBusiness.id),
        servicesApi.list(activeBusiness.id),
        branchesApi.list(activeBusiness.id),
      ]);
      setProfessionals(profsResult.data.professionals);
      setServices(servResult.data.services);
      setBranches(branchResult.data.branches);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar datos');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (prof: Professional) => {
    setFormData({
      display_name: prof.display_name,
      branch_id: prof.branch_id,
      avatar_url: prof.avatar_url,
      bio: prof.bio,
    });
    setEditingId(prof.id);
    setSelectedServices(new Set());
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness || !formData.display_name) return;

    try {
      if (editingId) {
        await professionalsApi.update(editingId, formData);
        // Asignar servicios si se editó
        if (selectedServices.size > 0 || editingId) {
          await professionalsApi.assignServices(editingId, {
            service_ids: Array.from(selectedServices),
          });
        }
      } else {
        const result = await professionalsApi.create(activeBusiness.id, formData);
        // Asignar servicios al nuevo profesional
        if (selectedServices.size > 0) {
          await professionalsApi.assignServices(result.data.id, {
            service_ids: Array.from(selectedServices),
          });
        }
      }
      setFormData({ display_name: '' });
      setEditingId(null);
      setSelectedServices(new Set());
      setShowForm(false);
      loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar profesional');
    }
  };

  const handleDelete = async (profId: string) => {
    if (!confirm('¿Estás seguro de que querés desactivar este profesional?'))
      return;
    try {
      await professionalsApi.deactivate(profId);
      loadAllData();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al desactivar profesional');
    }
  };

  const toggleService = (serviceId: string) => {
    const newSet = new Set(selectedServices);
    if (newSet.has(serviceId)) {
      newSet.delete(serviceId);
    } else {
      newSet.add(serviceId);
    }
    setSelectedServices(newSet);
  };

  if (businessLoading || isLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Profesionales</h1>
        <Button
          onClick={() => {
            setFormData({ display_name: '' });
            setEditingId(null);
            setSelectedServices(new Set());
            setShowForm(true);
          }}
        >
          + Nuevo profesional
        </Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {showForm && (
        <Card>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg">
              {editingId ? 'Editar profesional' : 'Nuevo profesional'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre del profesional"
                value={formData.display_name}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    display_name: e.target.value,
                  })
                }
                required
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sucursal (opcional)
                </label>
                <select
                  value={formData.branch_id || ''}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      branch_id: e.target.value || undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black focus:border-transparent"
                >
                  <option value="">-- Sin sucursal --</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Bio (opcional)"
                value={formData.bio || ''}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
              />
              <Input
                label="URL Avatar (opcional)"
                value={formData.avatar_url || ''}
                onChange={(e) =>
                  setFormData({ ...formData, avatar_url: e.target.value })
                }
              />

              {services.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Servicios que realiza
                  </label>
                  <div className="space-y-2 bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                    {services.map((service) => (
                      <div key={service.id} className="flex items-center">
                        <input
                          type="checkbox"
                          id={service.id}
                          checked={selectedServices.has(service.id)}
                          onChange={() => toggleService(service.id)}
                          className="w-4 h-4"
                        />
                        <label
                          htmlFor={service.id}
                          className="ml-2 text-sm text-gray-700"
                        >
                          {service.name} ({service.duration_minutes} min)
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button type="submit" className="flex-1">
                  Guardar
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowForm(false);
                    setEditingId(null);
                    setFormData({ display_name: '' });
                    setSelectedServices(new Set());
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
        {professionals.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No hay profesionales. Agrega tu primer profesional.
            </CardContent>
          </Card>
        ) : (
          professionals.map((prof) => (
            <Card key={prof.id}>
              <CardContent className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900">
                      {prof.display_name}
                    </h3>
                    {prof.branch_id && (
                      <p className="text-sm text-gray-600">
                        📍{' '}
                        {branches.find((b) => b.id === prof.branch_id)?.name ||
                          'Sucursal desconocida'}
                      </p>
                    )}
                    {prof.bio && (
                      <p className="text-sm text-gray-600 mt-1">{prof.bio}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(prof)}
                    >
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(prof.id)}
                    >
                      Eliminar
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
