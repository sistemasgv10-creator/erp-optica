import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { generateFolio } from '@/lib/utils';

const ordenSchema = z.object({
  hojaViajeraId: z.string(),
  sede: z.string(),
  esGarantia: z.boolean().default(false),
  items: z.array(
    z.object({
      productoId: z.string(),
      cantidad: z.number().min(1),
    })
  ),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const ordenes = await prisma.orderBeneficencia.findMany({
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        hojaViajera: true,
      },
      orderBy: {
        fechaPedido: 'desc',
      },
    });

    return NextResponse.json(ordenes);
  } catch (error) {
    console.error('Error al obtener órdenes:', error);
    return NextResponse.json(
      { error: 'Error al obtener órdenes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ordenSchema.parse(body);

    const orden = await prisma.orderBeneficencia.create({
      data: {
        folio: generateFolio('BEN'),
        hojaViajeraId: validatedData.hojaViajeraId,
        sede: validatedData.sede,
        esGarantia: validatedData.esGarantia,
        items: {
          create: validatedData.items,
        },
      },
      include: {
        items: {
          include: {
            producto: true,
          },
        },
      },
    });

    return NextResponse.json(orden, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al crear orden:', error);
    return NextResponse.json(
      { error: 'Error al crear orden' },
      { status: 500 }
    );
  }
}
