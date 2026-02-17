'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Users, Plus, Edit2, UserX, UserCheck, X, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Usuario {
    id: string;
    email: string;
    name: string;
    role: string;
    active: boolean;
    createdAt: string;
}

const roleOptions = [
    { value: 'SUPER_ADMIN', label: 'Super Administrador' },
    { value: 'ADMIN_DISTRIBUIDORA', label: 'Admin Distribuidora' },
    { value: 'VENDEDOR', label: 'Vendedor' },
    { value: 'ALMACEN_BENEFICENCIA', label: 'Almacén Beneficencia' },
    { value: 'ALMACEN_SEDENA', label: 'Almacén Sedena' },
    { value: 'ALMACEN_PT', label: 'Producto Terminado' },
    { value: 'PRODUCCION', label: 'Producción' },
];

const roleBadgeColors: Record<string, string> = {
    SUPER_ADMIN: 'bg-red-100 text-red-800',
    ADMIN_DISTRIBUIDORA: 'bg-blue-100 text-blue-800',
    VENDEDOR: 'bg-green-100 text-green-800',
    ALMACEN_BENEFICENCIA: 'bg-purple-100 text-purple-800',
    ALMACEN_SEDENA: 'bg-yellow-100 text-yellow-800',
    ALMACEN_PT: 'bg-orange-100 text-orange-800',
    PRODUCCION: 'bg-cyan-100 text-cyan-800',
};

export default function UsuariosPage() {
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState<Usuario | null>(null);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'VENDEDOR',
    });

    const fetchUsuarios = async () => {
        try {
            const res = await fetch('/api/usuarios');
            if (res.ok) {
                const data = await res.json();
                setUsuarios(data);
            } else {
                toast.error('Error al cargar usuarios');
            }
        } catch {
            toast.error('Error de conexión');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsuarios();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name || !formData.email || !formData.role) {
            toast.error('Completa todos los campos obligatorios');
            return;
        }

        if (!editingUser && !formData.password) {
            toast.error('La contraseña es obligatoria para nuevos usuarios');
            return;
        }

        try {
            const url = editingUser
                ? `/api/usuarios/${editingUser.id}`
                : '/api/usuarios';
            const method = editingUser ? 'PUT' : 'POST';

            const bodyData: Record<string, string> = {
                name: formData.name,
                email: formData.email,
                role: formData.role,
            };

            if (formData.password) {
                bodyData.password = formData.password;
            }

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(bodyData),
            });

            if (res.ok) {
                toast.success(
                    editingUser
                        ? 'Usuario actualizado exitosamente'
                        : 'Usuario creado exitosamente'
                );
                closeModal();
                fetchUsuarios();
            } else {
                const data = await res.json();
                toast.error(data.error || 'Error al guardar usuario');
            }
        } catch {
            toast.error('Error de conexión');
        }
    };

    const handleToggleActive = async (usuario: Usuario) => {
        const action = usuario.active ? 'desactivar' : 'activar';

        try {
            if (usuario.active) {
                // Desactivar (DELETE)
                const res = await fetch(`/api/usuarios/${usuario.id}`, {
                    method: 'DELETE',
                });

                if (res.ok) {
                    toast.success(`Usuario ${action}do exitosamente`);
                    fetchUsuarios();
                } else {
                    const data = await res.json();
                    toast.error(data.error || `Error al ${action} usuario`);
                }
            } else {
                // Reactivar (PUT)
                const res = await fetch(`/api/usuarios/${usuario.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ active: true }),
                });

                if (res.ok) {
                    toast.success(`Usuario ${action}do exitosamente`);
                    fetchUsuarios();
                } else {
                    const data = await res.json();
                    toast.error(data.error || `Error al ${action} usuario`);
                }
            }
        } catch {
            toast.error('Error de conexión');
        }
    };

    const openCreateModal = () => {
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'VENDEDOR' });
        setShowPassword(false);
        setShowModal(true);
    };

    const openEditModal = (usuario: Usuario) => {
        setEditingUser(usuario);
        setFormData({
            name: usuario.name,
            email: usuario.email,
            password: '',
            role: usuario.role,
        });
        setShowPassword(false);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setEditingUser(null);
        setFormData({ name: '', email: '', password: '', role: 'VENDEDOR' });
    };

    const getRoleLabel = (role: string) => {
        return roleOptions.find((r) => r.value === role)?.label || role;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
                    <p className="text-gray-600 mt-2">
                        Administra los usuarios del sistema y asigna sus roles
                    </p>
                </div>
                <Button
                    onClick={openCreateModal}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                >
                    <Plus className="w-4 h-4" />
                    Nuevo Usuario
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Usuarios</p>
                            <p className="text-2xl font-bold text-gray-900">{usuarios.length}</p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 rounded-lg">
                            <UserCheck className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Activos</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {usuarios.filter((u) => u.active).length}
                            </p>
                        </div>
                    </div>
                </div>
                <div className="stat-card">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                            <UserX className="w-6 h-6 text-red-600" />
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Inactivos</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {usuarios.filter((u) => !u.active).length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabla de usuarios */}
            <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Usuario
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Email
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Rol
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Estado
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Fecha Creación
                                </th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {usuarios.map((usuario) => (
                                <tr key={usuario.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                                                <span className="text-white font-semibold text-sm">
                                                    {usuario.name
                                                        .split(' ')
                                                        .map((n) => n[0])
                                                        .join('')
                                                        .slice(0, 2)
                                                        .toUpperCase()}
                                                </span>
                                            </div>
                                            <span className="font-medium text-gray-900">{usuario.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{usuario.email}</td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleBadgeColors[usuario.role] || 'bg-gray-100 text-gray-800'
                                                }`}
                                        >
                                            {getRoleLabel(usuario.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${usuario.active
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-red-100 text-red-800'
                                                }`}
                                        >
                                            {usuario.active ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(usuario.createdAt).toLocaleDateString('es-MX')}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEditModal(usuario)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleToggleActive(usuario)}
                                                className={`p-2 rounded-lg transition-colors ${usuario.active
                                                        ? 'text-red-600 hover:bg-red-50'
                                                        : 'text-green-600 hover:bg-green-50'
                                                    }`}
                                                title={usuario.active ? 'Desactivar' : 'Activar'}
                                            >
                                                {usuario.active ? (
                                                    <UserX className="w-4 h-4" />
                                                ) : (
                                                    <UserCheck className="w-4 h-4" />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal de crear/editar usuario */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
                        <div className="flex items-center justify-between p-6 border-b">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingUser ? 'Editar Usuario' : 'Nuevo Usuario'}
                            </h3>
                            <button
                                onClick={closeModal}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre completo *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ej: Juan Pérez"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) =>
                                        setFormData({ ...formData, email: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Ej: usuario@optica.com"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Contraseña {editingUser ? '(dejar vacío para mantener)' : '*'}
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={formData.password}
                                        onChange={(e) =>
                                            setFormData({ ...formData, password: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                                        placeholder={editingUser ? '••••••••' : 'Ingresa la contraseña'}
                                        required={!editingUser}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Rol *
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) =>
                                        setFormData({ ...formData, role: e.target.value })
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required
                                >
                                    {roleOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModal}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    type="submit"
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                    {editingUser ? 'Guardar Cambios' : 'Crear Usuario'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
