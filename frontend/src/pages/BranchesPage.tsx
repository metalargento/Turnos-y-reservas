import React, { useState, useEffect } from 'react';
import { Card, CardContent, Button, Input, Alert } from '../components/ui';
import { branchesApi } from '../api/branches';
import { useBusinessContext } from '../contexts/BusinessContext';
import type { Branch, BranchCreateRequest } from '../types';

export function BranchesPage() {
  const { activeBusiness, isLoading: businessLoading } = useBusinessContext();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<BranchCreateRequest>({
    name: '',
  });

  useEffect(() => {
    if (!activeBusiness) return;
    loadBranches();
  }, [activeBusiness?.id]);

  const loadBranches = async () => {
    if (!activeBusiness) return;
    setIsLoading(true);
    try {
      const result = await branchesApi.list(activeBusiness.id);
      setBranches(result.data.branches);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al cargar sucursales');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBusiness) return;

    try {
      if (editingId) {
        await branchesApi.update(editingId, formData);
      } else {
        await branchesApi.create(activeBusiness.id, formData);
      }
      setFormData({ name: '' });
      setEditingId(null);
      setShowForm(false);
      loadBranches();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al guardar sucursal');
    }
  };

  const handleDelete = async (branchId: string) => {
    if (!confirm('¿Estás seguro de que querés desactivar esta sucursal?')) return;
    try {
      await branchesApi.deactivate(branchId);
      loadBranches();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Error al desactivar sucursal');
    }
  };

  if (businessLoading || isLoading) {
    return <div className="text-center py-8">Cargando...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Sucursales</h1>
        <Button onClick={() => setShowForm(true)}>+ Nueva sucursal</Button>
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {showForm && (
        <Card>
          <CardContent className="space-y-4">
            <h3 className="font-semibold text-lg">
              {editingId ? 'Editar sucursal' : 'Nueva sucursal'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nombre de la sucursal"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
              <Input
                label="Dirección (opcional)"
                value={formData.address || ''}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
              <Input
                label="Teléfono (opcional)"
                value={formData.phone || ''}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
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
                    setFormData({ name: '' });
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
        {branches.length === 0 ? (
          <Card>
            <CardContent className="text-center text-gray-500 py-8">
              No hay sucursales aún. Crea tu primera sucursal.
            </CardContent>
          </Card>
        ) : (
          branches.map((branch) => (
            <Card key={branch.id}>
              <CardContent className="flex justify-between items-center">
                <div>
                  <h3 className="font-semibold text-gray-900">{branch.name}</h3>
                  {branch.address && (
                    <p className="text-sm text-gray-600">{branch.address}</p>
                  )}
                  {branch.phone && (
                    <p className="text-sm text-gray-600">{branch.phone}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormData(branch);
                      setEditingId(branch.id);
                      setShowForm(true);
                    }}
                  >
                    Editar
                  </Button>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(branch.id)}
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
