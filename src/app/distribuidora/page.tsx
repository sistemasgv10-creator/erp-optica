import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { TrendingUp, FileText, DollarSign, Package } from 'lucide-react';
import prisma from '@/lib/db';
import { formatCurrency } from '@/lib/utils';

async function getDistribuidoraStats(userId?: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [ventasHoy, ventasMes, hojasViajeras, ventasRecientes] = await Promise.all([
    prisma.venta.aggregate({
      where: {
        fecha: { gte: today },
        ...(userId && { userId }),
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.venta.aggregate({
      where: {
        fecha: {
          gte: new Date(today.getFullYear(), today.getMonth(), 1),
        },
        ...(userId && { userId }),
      },
      _sum: { total: true },
      _count: true,
    }),
    prisma.hojaViajera.count({
      where: {
        fechaCreacion: { gte: today },
      },
    }),
    prisma.venta.findMany({
      where: userId ? { userId } : {},
      take: 5,
      orderBy: { fecha: 'desc' },
      include: { user: { select: { name: true } } },
    }),
  ]);

  return {
    ventasHoy: {
      total: ventasHoy._sum.total || 0,
      cantidad: ventasHoy._count,
    },
    ventasMes: {
      total: ventasMes._sum.total || 0,
      cantidad: ventasMes._count,
    },
    hojasViajeras,
    ventasRecientes,
  };
}

export default async function DistribuidoraPage() {
  const session = await getServerSession(authOptions);
  const isVendedor = session?.user.role === 'VENDEDOR';
  
  const stats = await getDistribuidoraStats(
    isVendedor ? session?.user.id : undefined
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {isVendedor ? 'Mis Ventas' : 'Distribuidora'}
        </h1>
        <p className="text-gray-600 mt-2">
          {isVendedor
            ? 'Panel de control de tus ventas'
            : 'Panel de control y resumen de ventas'}
        </p>
      </div>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div>
            <p className="stat-label">Ventas Hoy</p>
            <p className="stat-value">{formatCurrency(stats.ventasHoy.total)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.ventasHoy.cantidad} transacciones
            </p>
          </div>
        </div>

        <div className="stat-card">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="stat-label">Ventas del Mes</p>
            <p className="stat-value">{formatCurrency(stats.ventasMes.total)}</p>
            <p className="text-sm text-gray-600 mt-1">
              {stats.ventasMes.cantidad} transacciones
            </p>
          </div>
        </div>

        {!isVendedor && (
          <>
            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <FileText className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div>
                <p className="stat-label">Hojas Viajeras Hoy</p>
                <p className="stat-value">{stats.hojasViajeras}</p>
                <p className="text-sm text-gray-600 mt-1">Creadas hoy</p>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <Package className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div>
                <p className="stat-label">Productos Activos</p>
                <p className="stat-value">--</p>
                <p className="text-sm text-gray-600 mt-1">En catálogo</p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Ventas recientes */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Ventas Recientes</h2>
        </div>
        <div className="overflow-x-auto">
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
                {!isVendedor && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Vendedor
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Total
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {stats.ventasRecientes.length === 0 ? (
                <tr>
                  <td
                    colSpan={isVendedor ? 4 : 5}
                    className="px-6 py-4 text-center text-gray-500"
                  >
                    No hay ventas registradas
                  </td>
                </tr>
              ) : (
                stats.ventasRecientes.map((venta) => (
                  <tr key={venta.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {new Date(venta.fecha).toLocaleDateString('es-MX')}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{venta.cliente}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{venta.producto}</td>
                    {!isVendedor && (
                      <td className="px-6 py-4 text-sm text-gray-900">{venta.user.name}</td>
                    )}
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {formatCurrency(venta.total)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
