'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Package2, Loader2, CheckCircle, RefreshCw, Printer } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface OrderBeneficencia {
  id: string;
  folio: string;
  sede: string;
  esGarantia: boolean;
  estatus: string;
  fechaPedido: string;
  fechaSurtido: string | null;
  observaciones: string | null;
  items: Array<{
    id: string;
    cantidad: number;
    surtido: boolean;
    producto: {
      codigo: string;
      nombre: string;
      categoria: string;
    };
  }>;
  hojaViajera: {
    folio: string;
    cliente: string;
  };
}

const estatusColors: Record<string, string> = {
  PENDIENTE: 'bg-yellow-100 text-yellow-800',
  HOJA_IMPRESA: 'bg-blue-100 text-blue-800',
  SURTIDO: 'bg-green-100 text-green-800',
  EN_PRODUCCION: 'bg-purple-100 text-purple-800',
  TERMINADO: 'bg-indigo-100 text-indigo-800',
  EMBARCADO: 'bg-teal-100 text-teal-800',
  ENTREGADO: 'bg-gray-100 text-gray-800',
};

const estatusLabels: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  HOJA_IMPRESA: 'Hoja Impresa',
  SURTIDO: 'Surtido',
  EN_PRODUCCION: 'En Producción',
  TERMINADO: 'Terminado',
  EMBARCADO: 'Embarcado',
  ENTREGADO: 'Entregado',
};

export default function BeneficenciaPage() {
  const [selectedTab, setSelectedTab] = useState<'normal' | 'garantias'>('normal');
  const queryClient = useQueryClient();

  // Obtener órdenes
  const { data: ordenes = [], isLoading } = useQuery<OrderBeneficencia[]>({
    queryKey: ['beneficencia'],
    queryFn: async () => {
      const res = await fetch('/api/beneficencia');
      if (!res.ok) throw new Error('Error al cargar órdenes');
      return res.json();
    },
    refetchInterval: 30000, // Actualizar cada 30 segundos
  });

  // Surtir orden
  const surtirMutation = useMutation({
    mutationFn: async (ordenId: string) => {
      const res = await fetch(`/api/beneficencia/${ordenId}/surtir`, {
        method: 'POST',
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al surtir');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Orden surtida exitosamente');
      queryClient.invalidateQueries({ queryKey: ['beneficencia'] });
      queryClient.invalidateQueries({ queryKey: ['inventario'] });
    },
    onError: (error: Error) => {
      if (error.message.includes('Stock insuficiente')) {
        toast.error('Stock insuficiente', {
          description: 'Se ha creado una solicitud de artículo',
        });
      } else {
        toast.error(error.message);
      }
    },
  });

  const actualizarOrdenes = () => {
    queryClient.invalidateQueries({ queryKey: ['beneficencia'] });
    toast.success('Órdenes actualizadas');
  };

  const imprimirHojaViajera = (orden: OrderBeneficencia) => {
    const ventana = window.open('', '_blank');
    if (ventana) {
      ventana.document.write(`
        <html>
          <head>
            <title>Hoja Viajera Beneficencia ${orden.folio}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .header { text-align: center; margin-bottom: 30px; }
              .info { margin-bottom: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #000; padding: 8px; text-align: left; }
              th { background-color: #f0f0f0; }
              @media print { button { display: none; } }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>HOJA VIAJERA - BENEFICENCIA</h1>
              <h2>Folio: ${orden.folio}</h2>
              ${orden.esGarantia ? '<p style="color: red; font-weight: bold;">*** GARANTÍA ***</p>' : ''}
            </div>
            <div class="info">
              <p><strong>Cliente:</strong> ${orden.hojaViajera.cliente}</p>
              <p><strong>Sede:</strong> ${orden.sede}</p>
              <p><strong>Fecha Pedido:</strong> ${formatDateTime(orden.fechaPedido)}</p>
              <p><strong>Hoja Viajera:</strong> ${orden.hojaViajera.folio}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Producto</th>
                  <th>Categoría</th>
                  <th>Cantidad</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                ${orden.items.map(item => `
                  <tr>
                    <td>${item.producto.codigo}</td>
                    <td>${item.producto.nombre}</td>
                    <td>${item.producto.categoria}</td>
                    <td>${item.cantidad}</td>
                    <td>${item.surtido ? 'Surtido' : 'Pendiente'}</td>
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
      ventana.document.close();
    }
  };

  // Filtrar órdenes
  const ordenesFiltradas = ordenes.filter((o) => o.esGarantia === (selectedTab === 'garantias'));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Beneficencia</h1>
          <p className="text-gray-600 mt-2">Gestión de órdenes de Beneficencia</p>
        </div>
        <Button onClick={actualizarOrdenes}>
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar BD
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setSelectedTab('normal')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'normal'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Beneficencia
          </button>
          <button
            onClick={() => setSelectedTab('garantias')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'garantias'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Beneficencia Garantías
          </button>
        </nav>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">Total Órdenes</p>
          <p className="stat-value">{ordenesFiltradas.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Pendientes</p>
          <p className="stat-value text-yellow-600">
            {ordenesFiltradas.filter((o) => o.estatus === 'PENDIENTE').length}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Surtidas</p>
          <p className="stat-value text-green-600">
            {ordenesFiltradas.filter((o) => o.estatus === 'SURTIDO').length}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">En Producción</p>
          <p className="stat-value text-purple-600">
            {ordenesFiltradas.filter((o) => o.estatus === 'EN_PRODUCCION').length}
          </p>
        </div>
      </div>

      {/* Lista de órdenes */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : ordenesFiltradas.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Package2 className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              No hay órdenes de {selectedTab === 'garantias' ? 'garantías' : 'beneficencia'}
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
                    Sede
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
                {ordenesFiltradas.map((orden) => (
                  <tr key={orden.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {orden.folio}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {orden.hojaViajera.cliente}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{orden.sede}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {orden.items.length} artículo(s)
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {formatDateTime(orden.fechaPedido)}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          estatusColors[orden.estatus]
                        }`}
                      >
                        {estatusLabels[orden.estatus]}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm space-x-2">
                      {orden.estatus === 'PENDIENTE' && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => imprimirHojaViajera(orden)}
                          >
                            <Printer className="w-4 h-4 mr-1" />
                            Imprimir
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => surtirMutation.mutate(orden.id)}
                            disabled={surtirMutation.isPending}
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Surtir
                          </Button>
                        </>
                      )}
                      {orden.estatus === 'SURTIDO' && (
                        <span className="text-green-600 text-sm">Listo para producción</span>
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
