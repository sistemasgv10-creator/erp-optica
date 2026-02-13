import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';

const talladoSchema = z.object({
  ordenId: z.string(),
  tipo: z.enum(['BENEFICENCIA', 'SEDENA']),
  tallador: z.string().min(1),
  cliente: z.string().min(1),
  observaciones: z.string().optional(),
});

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PRODUCCION') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const tallados = await prisma.controlTallado.findMany({
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
        calidadTallado: true,
      },
      orderBy: {
        fechaEntrada: 'desc',
      },
    });

    return NextResponse.json(tallados);
  } catch (error) {
    console.error('Error al obtener tallados:', error);
    return NextResponse.json(
      { error: 'Error al obtener tallados' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'PRODUCCION') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = talladoSchema.parse(body);

    // Verificar si ya existe producción para esta orden
    let produccionId;
    
    if (validatedData.tipo === 'BENEFICENCIA') {
      const produccion = await prisma.produccionBeneficencia.upsert({
        where: { ordenId: validatedData.ordenId },
        update: { enTallado: true },
        create: {
          ordenId: validatedData.ordenId,
          tipoProceso: 'TALLADO',
          enTallado: true,
        },
      });
      produccionId = produccion.id;
    } else {
      const produccion = await prisma.produccionSedena.upsert({
        where: { ordenId: validatedData.ordenId },
        update: { enTallado: true },
        create: {
          ordenId: validatedData.ordenId,
          tipoProceso: 'TALLADO',
          enTallado: true,
        },
      });
      produccionId = produccion.id;
    }

    // Crear control de tallado
    const tallado = await prisma.controlTallado.create({
      data: {
        tallador: validatedData.tallador,
        cliente: validatedData.cliente,
        observaciones: validatedData.observaciones,
        ...(validatedData.tipo === 'BENEFICENCIA'
          ? { produccionBeneficenciaId: produccionId }
          : { produccionSedenaId: produccionId }),
      },
      include: {
        produccionBeneficencia: true,
        produccionSedena: true,
      },
    });

    return NextResponse.json(tallado, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al crear tallado:', error);
    return NextResponse.json(
      { error: 'Error al crear tallado' },
      { status: 500 }
    );
  }
}
