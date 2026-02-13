import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { z } from 'zod';
import * as XLSX from 'xlsx';

const reporteSchema = z.object({
  fecha: z.string(),
  tipo: z.enum(['DIARIO', 'SEMANAL']),
  cliente: z.string(),
  producto: z.string(),
  cantidad: z.number(),
  diasAtraso: z.number(),
  observaciones: z.string().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo');
    const exportar = searchParams.get('export') === 'true';

    const reportes = await prisma.reporteAtraso.findMany({
      where: tipo ? { tipo } : {},
      orderBy: { fecha: 'desc' },
      take: 100,
    });

    if (exportar) {
      // Crear Excel
      const data = reportes.map((r) => ({
        Fecha: new Date(r.fecha).toLocaleDateString('es-MX'),
        Tipo: r.tipo,
        Cliente: r.cliente,
        Producto: r.producto,
        Cantidad: r.cantidad,
        'Días Atraso': r.diasAtraso,
        Observaciones: r.observaciones || '',
      }));

      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Reportes');

      const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename=reportes-atrasos-${Date.now()}.xlsx`,
        },
      });
    }

    return NextResponse.json(reportes);
  } catch (error) {
    console.error('Error al obtener reportes:', error);
    return NextResponse.json(
      { error: 'Error al obtener reportes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'ADMIN_DISTRIBUIDORA') {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reporteSchema.parse(body);

    const reporte = await prisma.reporteAtraso.create({
      data: {
        ...validatedData,
        fecha: new Date(validatedData.fecha),
      },
    });

    return NextResponse.json(reporte, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Datos inválidos', details: error.errors },
        { status: 400 }
      );
    }
    console.error('Error al crear reporte:', error);
    return NextResponse.json(
      { error: 'Error al crear reporte' },
      { status: 500 }
    );
  }
}
