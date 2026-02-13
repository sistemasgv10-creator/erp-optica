import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { Settings, CheckCircle, XCircle, Clock } from 'lucide-react';
import prisma from '@/lib/db';

async function getProduccionStats() {
  const [talladosPendientes, talladosOK, talladosMerma, biselesOK] = await Promise.all([
    prisma.controlTallado.count({
      where: {
        estatus: { in: ['ENTRADA', 'EN_PROCESO', 'SALIDA'] },
      },
    }),
    prisma.calidadTallado.count({
      where: { estatus: 'OK' },
    }),
    prisma.calidadTallado.count({
      where: { estatus: 'MERMA' },
    }),
    prisma.calidadBisel.count({
      where: { estatus: 'OK' },
    }),
  ]);

  return {
    talladosPendientes,
    talladosOK,
    talladosMerma,
    biselesOK,
  };
}

export default async function ProduccionPage() {
  const session = await getServerSession(authOptions);
  const stats = await getProduccionStats();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Producción</h1>
        <p className="text-gray-600 mt-2">Panel de control de producción</p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <div>
            <p className="stat-label">Tallados Pendientes</p>
            <p className="stat-value">{stats.talladosPendientes}</p>
            <p className="text-sm text-gray-600 mt-1">En proceso</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="stat-label">Tallados OK</p>
            <p className="stat-value">{stats.talladosOK}</p>
            <p className="text-sm text-gray-600 mt-1">Aprobados</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-red-100 rounded-lg">
              <XCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div>
            <p className="stat-label">Mermas Tallado</p>
            <p className="stat-value text-red-600">{stats.talladosMerma}</p>
            <p className="text-sm text-gray-600 mt-1">Total de mermas</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="stat-label">Biseles OK</p>
            <p className="stat-value">{stats.biselesOK}</p>
            <p className="text-sm text-gray-600 mt-1">Aprobados</p>
          </div>
        </div>
      </div>

      {/* Accesos rápidos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <a
          href="/produccion/tallado"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Settings className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Control Tallado</h3>
              <p className="text-sm text-gray-600">Gestión de tallado y calidad</p>
            </div>
          </div>
        </a>

        <a
          href="/produccion/bisel"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <Settings className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Control Bisel</h3>
              <p className="text-sm text-gray-600">Gestión de bisel y calidad</p>
            </div>
          </div>
        </a>

        <a
          href="/produccion/calidad"
          className="block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow border border-gray-200"
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Reportes Calidad</h3>
              <p className="text-sm text-gray-600">Análisis y métricas</p>
            </div>
          </div>
        </a>
      </div>
    </div>
  );
}
