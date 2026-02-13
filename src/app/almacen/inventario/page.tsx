'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Package, AlertTriangle, Loader2, Edit, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
  categoria: string;
  stockMinimo: number;
}

interface Inventario {
  id: string;
  productoId: string;
  cantidad: number;
  ubicacion: string;
  lote: string | null;
  fechaIngreso: string;
  ultimaActualizacion: string;
  producto: Producto;
}

export default function InventarioPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    productoId: '',
    cantidad: 0,
    ubicacion: 'ALMACEN-PRINCIPAL',
    lote: '',
  });

  // Obtener inventario
  const { data: inventario = [], isLoading } = useQuery<Inventario[]>({
    queryKey: ['inventario'],
    queryFn: async () => {
      const res = await fetch('/api/inventario');
      if (!res.ok) throw new Error('Error al cargar inventario');
      return res.json();
    },
  });

  // Obtener productos
  const { data: productos = [] } = useQuery<Producto[]>({
    queryKey: ['productos'],
    queryFn: async () => {
      const res = await fetch('/api/productos?activo=true');
      if (!res.ok) throw new Error('Error al cargar productos');
      return res.json();
    },
  });

  // Agregar/Actualizar inventario
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/inventario', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingId ? { id: editingId, ...data } : data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al guardar');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(editingId ? 'Inventario actualizado' : 'Inventario agregado');
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
      setIsFormOpen(false);
      setEditingId(null);
      setFormData({ productoId: '', cantidad: 0, ubicacion: 'ALMACEN-PRINCIPAL', lote: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const handleEdit = (item: Inventario) => {
    setEditingId(item.id);
    setFormData({
      productoId: item.productoId,
      cantidad: item.cantidad,
      ubicacion: item.ubicacion,
      lote: item.lote || '',
    });
    setIsFormOpen(true);
  };

  // Filtrar inventario
  const filteredInventario = inventario.filter((item) =>
    item.producto.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.producto.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Estadísticas
  const totalProductos = inventario.length;
  const bajoStock = inventario.filter(
    (item) => item.cantidad <= item.producto.stockMinimo
  ).length;
  const valorTotal = inventario.reduce((acc, item) => acc + item.cantidad, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Inventario</h1>
          <p className="text-gray-600 mt-2">Control completo de inventario</p>
        </div>
        <Button onClick={() => {
          setIsFormOpen(!isFormOpen);
          setEditingId(null);
          setFormData({ productoId: '', cantidad: 0, ubicacion: 'ALMACEN-PRINCIPAL', lote: '' });
        }}>
          <Plus className="w-4 h-4 mr-2" />
          Agregar Inventario
        </Button>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Package className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="stat-label">Total Productos</p>
            <p className="stat-value">{totalProductos}</p>
            <p className="text-sm text-gray-600 mt-1">En inventario</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div>
            <p className="stat-label">Bajo Stock</p>
            <p className="stat-value text-orange-600">{bajoStock}</p>
            <p className="text-sm text-gray-600 mt-1">Requieren atención</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Package className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="stat-label">Unidades Total</p>
            <p className="stat-value">{valorTotal}</p>
            <p className="text-sm text-gray-600 mt-1">En stock</p>
          </div>
        </div>
      </div>

      {/* Formulario */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">
            {editingId ? 'Editar Inventario' : 'Agregar Inventario'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Producto *
                </label>
                <select
                  required
                  value={formData.productoId}
                  onChange={(e) => setFormData({ ...formData, productoId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingId}
                >
                  <option value="">Seleccionar producto</option>
                  {productos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.codigo} - {p.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad *
                </label>
                <input
                  type="number"
                  required
                  min="0"
                  value={formData.cantidad}
                  onChange={(e) =>
                    setFormData({ ...formData, cantidad: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación *
                </label>
                <select
                  required
                  value={formData.ubicacion}
                  onChange={(e) => setFormData({ ...formData, ubicacion: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  disabled={!!editingId}
                >
                  <option value="ALMACEN-PRINCIPAL">Almacén Principal</option>
                  <option value="ALMACEN-SECUNDARIO">Almacén Secundario</option>
                  <option value="PT">Producto Terminado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Lote</label>
                <input
                  type="text"
                  value={formData.lote}
                  onChange={(e) => setFormData({ ...formData, lote: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Número de lote (opcional)"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsFormOpen(false);
                  setEditingId(null);
                }}
                disabled={saveMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Guardar'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Búsqueda */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nombre o código..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Lista de inventario */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : filteredInventario.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              {searchTerm ? 'No se encontraron resultados' : 'No hay inventario registrado'}
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Código
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Producto
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Categoría
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cantidad
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Ubicación
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Lote
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Última Act.
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredInventario.map((item) => {
                  const bajoStock = item.cantidad <= item.producto.stockMinimo;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {item.producto.codigo}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {item.producto.nombre}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {item.producto.categoria}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`font-semibold ${
                            bajoStock ? 'text-red-600' : 'text-gray-900'
                          }`}
                        >
                          {item.cantidad}
                        </span>
                        {bajoStock && (
                          <AlertTriangle className="inline w-4 h-4 ml-1 text-red-600" />
                        )}
                        <span className="text-xs text-gray-500 block">
                          Min: {item.producto.stockMinimo}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.ubicacion}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{item.lote || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDateTime(item.ultimaActualizacion)}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleEdit(item)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
