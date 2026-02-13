import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import { generateFolio } from '@/lib/utils';

const hojaViajeraSchema = z.object({
  cliente: z.string().min(1),
  observaciones: z.string().optional(),
  items: z.array(
    z.object({
      productoId: z.string(),
      cantidad: z.number().min(1),
      descripcion: z.string().optional(),
    })
  ).min(1, 'Debe agregar al menos un producto'),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    if (session.user.role !== 'ADMIN_DISTRIBUIDORA') {
      return NextResponse.json({ error: 'Sin permisos' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = hojaViajeraSchema.parse(body);

    const hojaViajera = await prisma.hojaViajera.create({
      data: {
        folio: generateFolio('HV'),
        cliente: validatedData.cliente,
        observaciones: validatedData.observaciones,
        userId: session.user.id,
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

    return NextResponse.json(hojaViajera, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al crear hoja viajera:', error);
    return NextResponse.json(
      { error: 'Error al crear la hoja viajera' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const hojas = await prisma.hojaViajera.findMany({
      include: {
        items: {
          include: {
            producto: true,
          },
        },
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        fechaCreacion: 'desc',
      },
    });

    return NextResponse.json(hojas);
  } catch (error) {
    console.error('Error al obtener hojas viajeras:', error);
    return NextResponse.json(
      { error: 'Error al obtener las hojas viajeras' },
      { status: 500 }
    );
  }
}
