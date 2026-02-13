import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const ventaSchema = z.object({
  cliente: z.string().min(1, 'El cliente es requerido'),
  producto: z.string().min(1, 'El producto es requerido'),
  cantidad: z.number().min(1, 'La cantidad debe ser mayor a 0'),
  precioUnitario: z.number().min(0, 'El precio debe ser mayor o igual a 0'),
  notas: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = ventaSchema.parse(body);

    const total = validatedData.cantidad * validatedData.precioUnitario;

    const venta = await prisma.venta.create({
      data: {
        ...validatedData,
        total,
        userId: session.user.id,
      },
    });

    return NextResponse.json(venta, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error al crear venta:', error);
    return NextResponse.json(
      { error: 'Error al crear la venta' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    
    // Si es vendedor, solo puede ver sus propias ventas
    const isVendedor = session.user.role === 'VENDEDOR';
    
    const ventas = await prisma.venta.findMany({
      where: isVendedor ? { userId: session.user.id } : userId ? { userId } : {},
      include: {
        user: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        fecha: 'desc',
      },
      take: 50,
    });

    return NextResponse.json(ventas);
  } catch (error) {
    console.error('Error al obtener ventas:', error);
    return NextResponse.json(
      { error: 'Error al obtener las ventas' },
      { status: 500 }
    );
  }
}
