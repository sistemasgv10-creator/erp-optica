'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Loader2, CheckCircle, XCircle, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { formatDateTime } from '@/lib/utils';

interface ControlTallado {
  id: string;
  tallador: string;
  cliente: string;
  estatus: string;
  fechaEntrada: string;
  fechaSalida: string | null;
  observaciones: string | null;
  intentosRetallado: number;
  calidadTallado: {
    estatus: string;
    inspector: string;
    requiereBisel: boolean;
  } | null;
}

const estatusColors: Record<string, string> = {
  ENTRADA: 'bg-blue-100 text-blue-800',
  EN_PROCESO: 'bg-yellow-100 text-yellow-800',
  SALIDA: 'bg-purple-100 text-purple-800',
  EN_CALIDAD: 'bg-indigo-100 text-indigo-800',
  APROBADO: 'bg-green-100 text-green-800',
  RETALLADO: 'bg-orange-100 text-orange-800',
  MERMA: 'bg-red-100 text-red-800',
};

export default function TalladoPage() {
  const [activeTab, setActiveTab] = useState<'control' | 'calidad'>('control');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isCalidadFormOpen, setIsCalidadFormOpen] = useState(false);
  const [selectedTallado, setSelectedTallado] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    ordenId: '',
    tipo: 'BENEFICENCIA' as 'BENEFICENCIA' | 'SEDENA',
    tallador: '',
    cliente: '',
    observaciones: '',
  });

  const [calidadFormData, setCalidadFormData] = useState({
    inspector: '',
    estatus: 'OK' as 'OK' | 'RETALLADO' | 'MERMA',
    requiereBisel: false,
    observaciones: '',
  });

  // Obtener tallados
  const { data: tallados = [], isLoading } = useQuery<ControlTallado[]>({
    queryKey: ['tallados'],
    queryFn: async () => {
      const res = await fetch('/api/produccion/tallado');
      if (!res.ok) throw new Error('Error al cargar tallados');
      return res.json();
    },
  });

  // Crear tallado
  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const res = await fetch('/api/produccion/tallado', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al crear tallado');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Tallado registrado exitosamente');
      queryClient.invalidateQueries({ queryKey: ['tallados'] });
      setIsFormOpen(false);
      setFormData({
        ordenId: '',
        tipo: 'BENEFICENCIA',
        tallador: '',
        cliente: '',
        observaciones: '',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  // Registrar calidad
  const calidadMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/produccion/tallado/calidad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Error al registrar calidad');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Calidad registrada exitosamente');
      queryClient.invalidateQueries({ queryKey: ['tallados'] });
      setIsCalidadFormOpen(false);
      setSelectedTallado(null);
      setCalidadFormData({
        inspector: '',
        estatus: 'OK',
        requiereBisel: false,
        observaciones: '',
      });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(formData);
  };

  const handleCalidadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTallado) return;
    calidadMutation.mutate({
      controlTalladoId: selectedTallado,
      ...calidadFormData,
    });
  };

  const abrirCalidad = (talladoId: string) => {
    setSelectedTallado(talladoId);
    setIsCalidadFormOpen(true);
  };

  // Filtrar tallados
  const talladosPendientes = tallados.filter((t) =>
    ['ENTRADA', 'EN_PROCESO', 'SALIDA'].includes(t.estatus)
  );
  const talladosCalidad = tallados.filter((t) => t.calidadTallado);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Control de Tallado</h1>
          <p className="text-gray-600 mt-2">Gestión de entrada, salida y calidad</p>
        </div>
        <Button onClick={() => setIsFormOpen(!isFormOpen)}>
          <Plus className="w-4 h-4 mr-2" />
          Nueva Entrada
        </Button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('control')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'control'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Control de Producción
          </button>
          <button
            onClick={() => setActiveTab('calidad')}
            className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'calidad'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
          >
            Control de Calidad
          </button>
        </nav>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="stat-label">En Proceso</p>
          <p className="stat-value text-yellow-600">{talladosPendientes.length}</p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Aprobados</p>
          <p className="stat-value text-green-600">
            {talladosCalidad.filter((t) => t.calidadTallado?.estatus === 'OK').length}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Retallados</p>
          <p className="stat-value text-orange-600">
            {talladosCalidad.filter((t) => t.calidadTallado?.estatus === 'RETALLADO').length}
          </p>
        </div>
        <div className="stat-card">
          <p className="stat-label">Mermas</p>
          <p className="stat-value text-red-600">
            {talladosCalidad.filter((t) => t.calidadTallado?.estatus === 'MERMA').length}
          </p>
        </div>
      </div>

      {/* Formulario de entrada */}
      {isFormOpen && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Registrar Entrada a Tallado</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tipo de Orden *
                </label>
                <select
                  required
                  value={formData.tipo}
                  onChange={(e) =>
                    setFormData({ ...formData, tipo: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="BENEFICENCIA">Beneficencia</option>
                  <option value="SEDENA">Sedena</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID de Orden *
                </label>
                <input
                  type="text"
                  required
                  value={formData.ordenId}
                  onChange={(e) => setFormData({ ...formData, ordenId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="ID de la orden"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tallador *
                </label>
                <input
                  type="text"
                  required
                  value={formData.tallador}
                  onChange={(e) => setFormData({ ...formData, tallador: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nombre del tallador"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cliente *
                </label>
                <input
                  type="text"
                  required
                  value={formData.cliente}
                  onChange={(e) => setFormData({ ...formData, cliente: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nombre del cliente"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={formData.observaciones}
                  onChange={(e) => setFormData({ ...formData, observaciones: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Observaciones adicionales"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsFormOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Registrar Entrada'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Formulario de calidad */}
      {isCalidadFormOpen && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Registrar Control de Calidad</h2>
          <form onSubmit={handleCalidadSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspector *
                </label>
                <input
                  type="text"
                  required
                  value={calidadFormData.inspector}
                  onChange={(e) =>
                    setCalidadFormData({ ...calidadFormData, inspector: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  placeholder="Nombre del inspector"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resultado *
                </label>
                <select
                  required
                  value={calidadFormData.estatus}
                  onChange={(e) =>
                    setCalidadFormData({ ...calidadFormData, estatus: e.target.value as any })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="OK">OK</option>
                  <option value="RETALLADO">Retallado</option>
                  <option value="MERMA">Merma</option>
                </select>
              </div>

              {calidadFormData.estatus === 'OK' && (
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requiereBisel"
                    checked={calidadFormData.requiereBisel}
                    onChange={(e) =>
                      setCalidadFormData({
                        ...calidadFormData,
                        requiereBisel: e.target.checked,
                      })
                    }
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                  <label htmlFor="requiereBisel" className="text-sm text-gray-700">
                    Requiere Bisel
                  </label>
                </div>
              )}

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={calidadFormData.observaciones}
                  onChange={(e) =>
                    setCalidadFormData({ ...calidadFormData, observaciones: e.target.value })
                  }
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsCalidadFormOpen(false);
                  setSelectedTallado(null);
                }}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={calidadMutation.isPending}>
                {calidadMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  'Registrar Calidad'
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Tablas */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-12">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
          ) : activeTab === 'control' ? (
            talladosPendientes.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                No hay tallados en proceso
              </div>
            ) : (
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Tallador
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Fecha Entrada
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Estatus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Intentos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {talladosPendientes.map((tallado) => (
                    <tr key={tallado.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {tallado.tallador}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">{tallado.cliente}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {formatDateTime(tallado.fechaEntrada)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${estatusColors[tallado.estatus]
                            }`}
                        >
                          {tallado.estatus}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {tallado.intentosRetallado}
                      </td>
                      <td className="px-6 py-4">
                        <Button size="sm" onClick={() => abrirCalidad(tallado.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Calidad
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : talladosCalidad.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              No hay registros de calidad
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Tallador
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Inspector
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Resultado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Requiere Bisel
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Estatus Final
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {talladosCalidad.map((tallado) => (
                  <tr key={tallado.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {tallado.tallador}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {tallado.calidadTallado?.inspector}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${tallado.calidadTallado?.estatus === 'OK'
                            ? 'bg-green-100 text-green-800'
                            : tallado.calidadTallado?.estatus === 'RETALLADO'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                      >
                        {tallado.calidadTallado?.estatus === 'OK' ? (
                          <CheckCircle className="w-3 h-3 inline mr-1" />
                        ) : tallado.calidadTallado?.estatus === 'RETALLADO' ? (
                          <RotateCcw className="w-3 h-3 inline mr-1" />
                        ) : (
                          <XCircle className="w-3 h-3 inline mr-1" />
                        )}
                        {tallado.calidadTallado?.estatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {tallado.calidadTallado?.requiereBisel ? 'Sí' : 'No'}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${estatusColors[tallado.estatus]
                          }`}
                      >
                        {tallado.estatus}
                      </span>
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
