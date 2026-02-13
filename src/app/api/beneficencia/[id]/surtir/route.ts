import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const orden = await prisma.orderBeneficencia.findUnique({
      where: { id: params.id },
      include: { items: true },
    });

    if (!orden) {
      return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 });
    }

    // Verificar disponibilidad de inventario
    for (const item of orden.items) {
      const inventario = await prisma.inventario.findFirst({
        where: { productoId: item.productoId },
      });

      if (!inventario || inventario.cantidad < item.cantidad) {
        // Crear solicitud de artículo
        await prisma.solicitudArticulo.create({
          data: {
            productoId: item.productoId,
            cantidad: item.cantidad - (inventario?.cantidad || 0),
            motivo: `Orden Beneficencia ${orden.folio} - Stock insuficiente`,
            urgente: true,
          },
        });

        return NextResponse.json(
          {
            error: 'Stock insuficiente',
            faltante: item.productoId,
            solicitudCreada: true,
          },
          { status: 400 }
        );
      }
    }

    // Surtir orden (transacción)
    const result = await prisma.$transaction(async (tx) => {
      // Descontar del inventario
      for (const item of orden.items) {
        await tx.inventario.updateMany({
          where: { productoId: item.productoId },
          data: { cantidad: { decrement: item.cantidad } },
        });

        await tx.itemBeneficencia.update({
          where: { id: item.id },
          data: { surtido: true },
        });
      }

      // Actualizar orden
      const ordenActualizada = await tx.orderBeneficencia.update({
        where: { id: params.id },
        data: {
          estatus: 'SURTIDO',
          fechaSurtido: new Date(),
        },
        include: {
          items: {
            include: {
              producto: true,
            },
          },
        },
      });

      // Crear notificación para producción
      await tx.notificacion.create({
        data: {
          tipo: 'ORDEN_SURTIDA',
          titulo: 'Orden Beneficencia Surtida',
          mensaje: `La orden ${orden.folio} ha sido surtida y está lista para producción`,
          modulo: 'PRODUCCION',
        },
      });

      return ordenActualizada;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error al surtir orden:', error);
    return NextResponse.json(
      { error: 'Error al surtir orden' },
      { status: 500 }
    );
  }
}
