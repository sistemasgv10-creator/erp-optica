import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Users, Shield, Settings } from 'lucide-react';
import Link from 'next/link';

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        redirect('/login');
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Administración</h1>
                <p className="text-gray-600 mt-2">
                    Panel de administración del sistema
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link
                    href="/admin/usuarios"
                    className="stat-card hover:shadow-lg transition-shadow cursor-pointer block"
                >
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-blue-100 rounded-lg">
                            <Users className="w-8 h-8 text-blue-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Gestión de Usuarios</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Crear, editar y administrar usuarios y sus roles
                    </p>
                </Link>

                <div className="stat-card opacity-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-purple-100 rounded-lg">
                            <Shield className="w-8 h-8 text-purple-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Roles y Permisos</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Configurar roles y permisos del sistema
                    </p>
                    <span className="text-xs text-gray-400 mt-2 block">Próximamente</span>
                </div>

                <div className="stat-card opacity-50">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-3 bg-green-100 rounded-lg">
                            <Settings className="w-8 h-8 text-green-600" />
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">Configuración</h3>
                    <p className="text-sm text-gray-600 mt-1">
                        Configuración general del sistema
                    </p>
                    <span className="text-xs text-gray-400 mt-2 block">Próximamente</span>
                </div>
            </div>
        </div>
    );
}
