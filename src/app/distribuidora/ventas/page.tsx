'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface Venta {
  id: string;
  fecha: string;
  cliente: string;
  producto: string;
  cantidad: number;
  precioUnitario: number;
  total: number;
  notas: string | null;
  user: {
    name: string;
  };
}

export default function VentasPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const queryClient = useQueryClient();

  // Obtener ventas
  const { data: ventas = [], isLoading } = useQuery<Venta[]>({
    queryKey: ['ventas'],
    queryFn: async () => {
      const res = await fetch('/api/ventas');
      if (!res.ok) throw new Error('Error al cargar ventas');
      return res.json();
    },
  });

  // Formulario
  const [formData, setFormData] = useState({
    cliente: '',
    producto: '',
    cantidad: 1,
    precioUnitario: 0,
    notas: '',
  });

  // Mutación para crear venta
  const createVentaMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/ventas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear venta');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Venta registrada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['ventas'] });
      setIsFormOpen(false);
      setFormData({
        cliente: '',
        producto: '',
        cantidad: 1,
        precioUnitario: 0,
        notas: '',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createVentaMutation.mutate(formData);
  };

  const total = formData.cantidad * formData.precioUnitario;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Ventas</h1>
          <p className="text-gray-600 mt-2">Registra y gestiona tus ventas</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Venta
        </Button>
      </div>

      {/* Formulario de nueva venta */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Registrar Nueva Venta</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto *
                </label>
                <input
                  type="text"
                  required
                  value={formData.producto}
                  onChange={(e) => setFormData({ ...formData, producto: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nombre del producto"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={formData.cantidad}
                  onChange={(e) =>
                    setFormData({ ...formData, cantidad: parseInt(e.target.value) || 1 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Precio Unitario *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  step="0.01"
                  value={formData.precioUnitario}
                  onChange={(e) =>
                    setFormData({ ...formData, precioUnitario: parseFloat(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Notas adicionales (opcional)"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-lg font-semibold">
                Total: <span className="text-blue-600">{formatCurrency(total)}</span>
              </div>
              <div className="flex space-x-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsFormOpen(false)}
                  disabled={createVentaMutation.isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={createVentaMutation.isPending}>
                  {createVentaMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    'Registrar Venta'
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Lista de ventas */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold">Historial de Ventas</h2>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : ventas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay ventas registradas. Crea tu primera venta.
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    P. Unit.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vendedor
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {ventas.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatDateTime(venta.fecha)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{venta.cliente}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{venta.producto}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{venta.cantidad}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatCurrency(venta.precioUnitario)}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(venta.total)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{venta.user.name}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
