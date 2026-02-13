import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const estatusSchema = z.object({
  estatus: z.enum(['IMPRESA', 'ENTREGADA_ALMACEN', 'EN_PROCESO', 'COMPLETADA']),
});

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { estatus } = estatusSchema.parse(body);

    const hojaViajera = await prisma.hojaViajera.update({
      where: { id: params.id },
      data: {
        estatus,
        ...(estatus === 'IMPRESA' && { fechaImpresion: new Date() }),
        ...(estatus === 'ENTREGADA_ALMACEN' && { fechaEntrega: new Date() }),
      },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    return NextResponse.json(hojaViajera);
  } catch (error) {
    console.error('Error al actualizar estatus:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el estatus' },
      { status: 500 }
    );
  }
}
