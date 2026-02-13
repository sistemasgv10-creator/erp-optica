import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const calidadSchema = z.object({
  controlTalladoId: z.string(),
  inspector: z.string().min(1),
  estatus: z.enum(['OK', 'RETALLADO', 'MERMA']),
  requiereBisel: z.boolean().default(false),
  observaciones: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PRODUCCION') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = calidadSchema.parse(body);

    const result = await prisma.$transaction(async (tx) => {
      // Crear registro de calidad
      const calidad = await tx.calidadTallado.create({
        data: validatedData,
      });

      // Actualizar control de tallado
      let nuevoEstatus;
      if (validatedData.estatus === 'OK') {
        nuevoEstatus = 'APROBADO';
      } else if (validatedData.estatus === 'RETALLADO') {
        nuevoEstatus = 'RETALLADO';
      } else {
        nuevoEstatus = 'MERMA';
      }

      const controlTallado = await tx.controlTallado.update({
        where: { id: validatedData.controlTalladoId },
        data: {
          estatus: nuevoEstatus,
          ...(validatedData.estatus === 'RETALLADO' && {
            intentosRetallado: { increment: 1 },
          }),
        },
        include: {
          produccionBeneficencia: {
            include: {
              orden: {
                include: {
                  items: {
                    include: {
                      producto: true,
                    },
                  },
                },
              },
            },
          },
          produccionSedena: {
            include: {
              orden: {
                include: {
                  items: {
                    include: {
                      producto: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      // Si es merma, crear notificación y registro
      if (validatedData.estatus === 'MERMA') {
        const orden =
          controlTallado.produccionBeneficencia?.orden ||
          controlTallado.produccionSedena?.orden;

        if (orden && orden.items.length > 0) {
          await tx.merma.create({
            data: {
              productoId: orden.items[0].productoId,
              userId: session.user.id,
              cantidad: 1,
              tipo: 'PRODUCCION_TALLADO',
              responsable: controlTallado.tallador,
              motivo: 'Rechazado en control de calidad',
              observaciones: validatedData.observaciones,
            },
          });

          // Descontar del inventario
          await tx.inventario.updateMany({
            where: { productoId: orden.items[0].productoId },
            data: { cantidad: { decrement: 1 } },
          });

          // Notificar a almacén
          await tx.notificacion.create({
            data: {
              tipo: 'MERMA_PRODUCCION',
              titulo: 'Merma en Tallado',
              mensaje: `Merma registrada por tallador ${controlTallado.tallador}`,
              modulo: 'ALMACEN',
            },
          });
        }
      }

      // Si es OK y requiere bisel, pasar a bisel
      if (validatedData.estatus === 'OK' && validatedData.requiereBisel) {
        if (controlTallado.produccionBeneficenciaId) {
          await tx.produccionBeneficencia.update({
            where: { id: controlTallado.produccionBeneficenciaId },
            data: { enBisel: true },
          });
        } else if (controlTallado.produccionSedenaId) {
          await tx.produccionSedena.update({
            where: { id: controlTallado.produccionSedenaId },
            data: { enBisel: true },
          });
        }
      }

      // Si es OK y NO requiere bisel, marcar como completado
      if (validatedData.estatus === 'OK' && !validatedData.requiereBisel) {
        if (controlTallado.produccionBeneficenciaId) {
          await tx.produccionBeneficencia.update({
            where: { id: controlTallado.produccionBeneficenciaId },
            data: { completado: true },
          });
          await tx.orderBeneficencia.update({
            where: { id: controlTallado.produccionBeneficencia!.ordenId },
            data: { estatus: 'TERMINADO' },
          });
        } else if (controlTallado.produccionSedenaId) {
          await tx.produccionSedena.update({
            where: { id: controlTallado.produccionSedenaId },
            data: { completado: true },
          });
          await tx.orderSedena.update({
            where: { id: controlTallado.produccionSedena!.ordenId },
            data: { estatus: 'TERMINADO' },
          });
        }
      }

      return calidad;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al registrar calidad:', error);
    return NextResponse.json(
      { error: 'Error al registrar calidad' },
      { status: 500 }
    );
  }
}
