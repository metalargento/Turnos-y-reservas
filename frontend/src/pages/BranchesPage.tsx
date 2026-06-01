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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-neutral-100">Sucursales</h1>

      {error && <Alert variant="error">{error}</Alert>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 min-h-screen">
        {/* Columna Izquierda: Formulario */}
        <div className="col-span-1">
          <Card className="sticky top-6">
            <CardContent className="space-y-4">
              <h3 className="font-semibold text-lg dark:text-neutral-100">
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
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setFormData({ name: '' });
                      setEditingId(null);
                    }}
                  >
                    Reset
                  </Button>
                  <Button type="submit" className="flex-1">
                    {editingId ? 'Actualizar' : 'Crear sucursal'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Lista de Sucursales */}
        <div className="col-span-2">
          <div className="space-y-3">
            {branches.length === 0 ? (
              <Card>
                <CardContent className="text-center text-gray-500 py-8">
                  No hay sucursales aún. Crea tu primera sucursal.
                </CardContent>
              </Card>
            ) : (
              branches.map((branch) => (
                <Card key={branch.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-neutral-100">
                          {branch.name}
                        </h3>
                        {branch.address && (
                          <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
                            {branch.address}
                          </p>
                        )}
                        {branch.phone && (
                          <p className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
                            {branch.phone}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 w-full md:w-auto md:flex-shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setFormData(branch);
                            setEditingId(branch.id);
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
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
