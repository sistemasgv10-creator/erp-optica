'use client';

import { signOut } from 'next-auth/react';
import { Bell, LogOut, User, Settings } from 'lucide-react';
import { Button } from '../ui/button';
import { getInitials } from '@/lib/utils';
import { toast } from 'sonner';

interface HeaderProps {
  userName: string;
  userRole: string;
}

const roleNames: Record<string, string> = {
  SUPER_ADMIN: 'Super Administrador',
  ADMIN_DISTRIBUIDORA: 'Admin Distribuidora',
  VENDEDOR: 'Vendedor',
  ALMACEN_BENEFICENCIA: 'Almacén Beneficencia',
  ALMACEN_SEDENA: 'Almacén Sedena',
  ALMACEN_PT: 'Producto Terminado',
  PRODUCCION: 'Producción',
};

export function Header({ userName, userRole }: HeaderProps) {
  const handleLogout = async () => {
    toast.loading('Cerrando sesión...');
    await signOut({ callbackUrl: '/login' });
  };

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* Breadcrumb o título dinámico */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Dashboard</h2>
          <p className="text-sm text-gray-500">Bienvenido al sistema</p>
        </div>

        {/* Acciones del usuario */}
        <div className="flex items-center space-x-4">
          {/* Notificaciones */}
          <button className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* Usuario */}
          <div className="flex items-center space-x-3 px-3 py-2 bg-gray-50 rounded-lg">
            <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-sm">{getInitials(userName)}</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{userName}</p>
              <p className="text-xs text-gray-500">{roleNames[userRole] || userRole}</p>
            </div>
          </div>

          {/* Botón de logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            className="text-gray-600 hover:text-red-600"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
