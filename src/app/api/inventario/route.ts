import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const inventarioSchema = z.object({
  productoId: z.string(),
  cantidad: z.number().min(0),
  ubicacion: z.string(),
  lote: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const ubicacion = searchParams.get('ubicacion');

    const inventario = await prisma.inventario.findMany({
      where: ubicacion ? { ubicacion } : {},
      include: {
        producto: true,
      },
      orderBy: {
        producto: {
          nombre: 'asc',
        },
      },
    });

    return NextResponse.json(inventario);
  } catch (error) {
    console.error('Error al obtener inventario:', error);
    return NextResponse.json(
      { error: 'Error al obtener el inventario' },
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
    const validatedData = inventarioSchema.parse(body);

    const inventario = await prisma.inventario.upsert({
      where: {
        productoId_ubicacion: {
          productoId: validatedData.productoId,
          ubicacion: validatedData.ubicacion,
        },
      },
      update: {
        cantidad: { increment: validatedData.cantidad },
        lote: validatedData.lote,
      },
      create: validatedData,
      include: {
        producto: true,
      },
    });

    return NextResponse.json(inventario, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al crear/actualizar inventario:', error);
    return NextResponse.json(
      { error: 'Error al procesar inventario' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const { id, cantidad } = body;

    const inventario = await prisma.inventario.update({
      where: { id },
      data: { cantidad },
      include: {
        producto: true,
      },
    });

    return NextResponse.json(inventario);
  } catch (error) {
    console.error('Error al actualizar inventario:', error);
    return NextResponse.json(
      { error: 'Error al actualizar inventario' },
      { status: 500 }
    );
  }
}
