'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Printer, CheckCircle, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface Producto {
  id: string;
  codigo: string;
  nombre: string;
}

interface HojaViajeraItem {
  id: string;
  productoId: string;
  cantidad: number;
  descripcion: string | null;
  producto: Producto;
}

interface HojaViajera {
  id: string;
  folio: string;
  cliente: string;
  estatus: string;
  fechaCreacion: string;
  fechaImpresion: string | null;
  fechaEntrega: string | null;
  observaciones: string | null;
  items: HojaViajeraItem[];
  user: {
    name: string;
  };
}

const estatusColors: Record<string, string> = {
  CREADA: 'bg-gray-100 text-gray-800',
  IMPRESA: 'bg-blue-100 text-blue-800',
  ENTREGADA_ALMACEN: 'bg-green-100 text-green-800',
  EN_PROCESO: 'bg-yellow-100 text-yellow-800',
  COMPLETADA: 'bg-purple-100 text-purple-800',
};

const estatusLabels: Record<string, string> = {
  CREADA: 'Creada',
  IMPRESA: 'Impresa',
  ENTREGADA_ALMACEN: 'Entregada a Almacén',
  EN_PROCESO: 'En Proceso',
  COMPLETADA: 'Completada',
};

export default function HojasViajerasPage() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedItems, setSelectedItems] = useState<
    Array<{ productoId: string; cantidad: number; descripcion: string }>
  >([{ productoId: '', cantidad: 1, descripcion: '' }]);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    cliente: '',
    observaciones: '',
  });

  // Obtener hojas viajeras
  const { data: hojas = [], isLoading } = useQuery<HojaViajera[]>({
    queryKey: ['hojas-viajeras'],
    queryFn: async () => {
      const res = await fetch('/api/hojas-viajeras');
      if (!res.ok) throw new Error('Error al cargar hojas viajeras');
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

  // Crear hoja viajera
  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/hojas-viajeras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear hoja viajera');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Hoja viajera creada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['hojas-viajeras'] });
      setIsFormOpen(false);
      setFormData({ cliente: '', observaciones: '' });
      setSelectedItems([{ productoId: '', cantidad: 1, descripcion: '' }]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Cambiar estatus
  const cambiarEstatusMutation = useMutation({
    mutationFn: async ({ id, estatus }: { id: string; estatus: string }) => {
      const res = await fetch(`/api/hojas-viajeras/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estatus }),
      });
      if (!res.ok) throw new Error('Error al cambiar estatus');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Estatus actualizado');
      queryClient.invalidateQueries({ queryKey: ['hojas-viajeras'] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const itemsValidos = selectedItems.filter((item) => item.productoId);
    if (itemsValidos.length === 0) {
      toast.error('Debes agregar al menos un producto');
      return;
    }
    createMutation.mutate({
      ...formData,
      items: itemsValidos,
    });
  };

  const agregarItem = () => {
    setSelectedItems([...selectedItems, { productoId: '', cantidad: 1, descripcion: '' }]);
  };

  const eliminarItem = (index: number) => {
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const actualizarItem = (index: number, field: string, value: any) => {
    const newItems = [...selectedItems];
    newItems[index] = { ...newItems[index], [field]: value };
    setSelectedItems(newItems);
  };

  const imprimirHoja = (hoja: HojaViajera) => {
    // Marcar como impresa
    cambiarEstatusMutation.mutate({ id: hoja.id, estatus: 'IMPRESA' });
    
    // Abrir ventana de impresión
    const ventanaImpresion = window.open('', '_blank');
    if (ventanaImpresion) {
      ventanaImpresion.document.write(`
        <html>
          <head>
            <title>Hoja Viajera ${hoja.folio}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f0f0f0; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>HOJA VIAJERA</h1>
              <h2>Folio: ${hoja.folio}</h2>
            </div>
            <div class="info">
              <p><strong>Cliente:</strong> ${hoja.cliente}</p>
              <p><strong>Fecha:</strong> ${formatDateTime(hoja.fechaCreacion)}</p>
              <p><strong>Creado por:</strong> ${hoja.user.name}</p>
              ${hoja.observaciones ? `<p><strong>Observaciones:</strong> ${hoja.observaciones}</p>` : ''}
            </div>
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Cantidad</th>
                  <th>Descripción</th>
                </tr>
              </thead>
              <tbody>
                ${hoja.items.map(item => `
                  <tr>
                    <td>${item.producto.codigo}</td>
                    <td>${item.producto.nombre}</td>
                    <td>${item.cantidad}</td>
                    <td>${item.descripcion || '-'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <br><br>
            <button onclick="window.print()">Imprimir</button>
            <button onclick="window.close()">Cerrar</button>
          </body>
        </html>
      `);
      ventanaImpresion.document.close();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Hojas Viajeras</h1>
          <p className="text-gray-600 mt-2">Gestión de hojas viajeras y seguimiento</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Hoja Viajera
        </Button>
      </div>

      {/* Formulario */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Crear Hoja Viajera</h2>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <input
                  type="text"
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Observaciones adicionales"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium text-gray-700">Productos *</label>
                <Button type="button" size="sm" onClick={agregarItem}>
                  <Plus className="w-4 h-4 mr-1" />
                  Agregar Producto
                </Button>
              </div>

              <div className="space-y-2">
                {selectedItems.map((item, index) => (
                  <div key={index} className="grid grid-cols-12 gap-2">
                    <div className="col-span-5">
                      <select
                        value={item.productoId}
                        onChange={(e) => actualizarItem(index, 'productoId', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      >
                        <option value="">Seleccionar producto</option>
                        {productos.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.codigo} - {p.nombre}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-2">
                      <input
                        type="number"
                        min="1"
                        value={item.cantidad}
                        onChange={(e) =>
                          actualizarItem(index, 'cantidad', parseInt(e.target.value) || 1)
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Cant."
                      />
                    </div>
                    <div className="col-span-4">
                      <input
                        type="text"
                        value={item.descripcion}
                        onChange={(e) => actualizarItem(index, 'descripcion', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        placeholder="Descripción"
                      />
                    </div>
                    <div className="col-span-1">
                      <button
                        type="button"
                        onClick={() => eliminarItem(index)}
                        className="w-full px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
                disabled={createMutation.isPending}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creando...
                  </>
                ) : (
                  'Crear Hoja Viajera'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Lista de hojas viajeras */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : hojas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              No hay hojas viajeras registradas
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Folio
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Productos
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Fecha
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estatus
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {hojas.map((hoja) => (
                  <tr key={hoja.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {hoja.folio}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{hoja.cliente}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {hoja.items.length} producto(s)
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(hoja.fechaCreacion)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          estatusColors[hoja.estatus]
                        }`}
                      >
                        {estatusLabels[hoja.estatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {hoja.estatus === 'CREADA' && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => imprimirHoja(hoja)}
                        >
                          <Printer className="w-4 h-4 mr-1" />
                          Imprimir
                        </Button>
                      )}
                      {hoja.estatus === 'IMPRESA' && (
                        <Button
                          size="sm"
                          onClick={() =>
                            cambiarEstatusMutation.mutate({
                              id: hoja.id,
                              estatus: 'ENTREGADA_ALMACEN',
                            })
                          }
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Entregar
                        </Button>
                      )}
                    </td>
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
