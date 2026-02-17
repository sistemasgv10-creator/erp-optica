import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import { hash } from 'bcryptjs';

// PUT - Actualizar un usuario
export async function PUT(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        const body = await req.json();
        const { email, name, role, active, password } = body;

        // Verificar que el usuario existe
        const usuarioExistente = await prisma.user.findUnique({
            where: { id: params.id },
        });

        if (!usuarioExistente) {
            return NextResponse.json(
                { error: 'Usuario no encontrado' },
                { status: 404 }
            );
        }

        // Si cambia el email, verificar que no esté en uso
        if (email && email !== usuarioExistente.email) {
            const emailEnUso = await prisma.user.findUnique({
                where: { email },
            });

            if (emailEnUso) {
                return NextResponse.json(
                    { error: 'El email ya está en uso por otro usuario' },
                    { status: 409 }
                );
            }
        }

        // Construir datos de actualización
        const updateData: Record<string, unknown> = {};
        if (email !== undefined) updateData.email = email;
        if (name !== undefined) updateData.name = name;
        if (role !== undefined) updateData.role = role;
        if (active !== undefined) updateData.active = active;
        if (password) updateData.password = await hash(password, 10);

        const usuario = await prisma.user.update({
            where: { id: params.id },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                active: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        return NextResponse.json(usuario);
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// DELETE - Desactivar un usuario (soft delete)
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session || session.user.role !== 'SUPER_ADMIN') {
            return NextResponse.json({ error: 'No autorizado' }, { status: 403 });
        }

        // No permitir que el SUPER_ADMIN se desactive a sí mismo
        if (params.id === session.user.id) {
            return NextResponse.json(
                { error: 'No puedes desactivar tu propia cuenta' },
                { status: 400 }
            );
        }

        const usuario = await prisma.user.update({
            where: { id: params.id },
            data: { active: false },
            select: {
                id: true,
                email: true,
                name: true,
                active: true,
            },
        });

        return NextResponse.json(usuario);
    } catch (error) {
        console.error('Error al desactivar usuario:', error);
        return NextResponse.json(
            { error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
