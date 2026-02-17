import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { hash } from 'bcryptjs';

// GET - Listar todos los usuarios
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const usuarios = await prisma.user.findMany({
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        return NextResponse.json(usuarios);
    } catch (error) {
        console.error('Error al obtener usuarios:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// POST - Crear un nuevo usuario
export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await req.json();
        const { email, name, password, role } = body;

        if (!email || !name || !password || !role) {
            return NextResponse.json(
                { error: 'Todos los campos son obligatorios' },
                { status: 400 }
            );
        }

        // Verificar si el email ya existe
        const existente = await prisma.user.findUnique({
            where: { email },
        });

        if (existente) {
            return NextResponse.json(
                { error: 'Ya existe un usuario con ese email' },
                { status: 409 }
            );
        }

        const hashedPassword = await hash(password, 10);

        const usuario = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role,
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
                createdAt: true,
            },
        });

        return NextResponse.json(usuario, { status: 201 });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
