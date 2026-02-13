'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Package,
  Warehouse,
  Factory,
  ShoppingCart,
  FileText,
  TrendingUp,
  Package2,
  Truck,
  ClipboardList,
  BarChart3,
  Settings,
} from 'lucide-react';
import { Role } from '@prisma/client';

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  children?: NavItem[];
}

const navigation: NavItem[] = [
  {
    title: 'Distribuidora',
    href: '/distribuidora',
    icon: ShoppingCart,
    roles: [Role.ADMIN_DISTRIBUIDORA, Role.VENDEDOR],
    children: [
      {
        title: 'Ventas',
        href: '/distribuidora/ventas',
        icon: TrendingUp,
        roles: [Role.ADMIN_DISTRIBUIDORA, Role.VENDEDOR],
      },
      {
        title: 'Hojas Viajeras',
        href: '/distribuidora/hojas-viajeras',
        icon: FileText,
        roles: [Role.ADMIN_DISTRIBUIDORA],
      },
      {
        title: 'Reportes de Atrasos',
        href: '/distribuidora/reportes',
        icon: BarChart3,
        roles: [Role.ADMIN_DISTRIBUIDORA],
      },
    ],
  },
  {
    title: 'Almacén',
    href: '/almacen',
    icon: Warehouse,
    roles: [Role.ALMACEN_BENEFICENCIA, Role.ALMACEN_SEDENA, Role.ALMACEN_PT],
    children: [
      {
        title: 'Inventario',
        href: '/almacen/inventario',
        icon: Package,
        roles: [Role.ALMACEN_BENEFICENCIA, Role.ALMACEN_SEDENA],
      },
      {
        title: 'Beneficencia',
        href: '/almacen/beneficencia',
        icon: Package2,
        roles: [Role.ALMACEN_BENEFICENCIA],
      },
      {
        title: 'Sedena',
        href: '/almacen/sedena',
        icon: Package2,
        roles: [Role.ALMACEN_SEDENA],
      },
      {
        title: 'Producto Terminado',
        href: '/almacen/pt',
        icon: ClipboardList,
        roles: [Role.ALMACEN_PT],
      },
      {
        title: 'Movimientos',
        href: '/almacen/movimientos',
        icon: Truck,
        roles: [Role.ALMACEN_PT],
      },
    ],
  },
  {
    title: 'Producción',
    href: '/produccion',
    icon: Factory,
    roles: [Role.PRODUCCION],
    children: [
      {
        title: 'Control Tallado',
        href: '/produccion/tallado',
        icon: Settings,
        roles: [Role.PRODUCCION],
      },
      {
        title: 'Control Bisel',
        href: '/produccion/bisel',
        icon: Settings,
        roles: [Role.PRODUCCION],
      },
      {
        title: 'Calidad',
        href: '/produccion/calidad',
        icon: BarChart3,
        roles: [Role.PRODUCCION],
      },
    ],
  },
];

interface SidebarProps {
  userRole: Role;
}

export function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname();

  const filteredNav = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <aside className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="/" className="flex items-center space-x-2">
          <LayoutDashboard className="w-8 h-8 text-blue-400" />
          <span className="text-xl font-bold">ERP Óptica</span>
        </Link>
      </div>

      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-2">
        {filteredNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const hasChildren = item.children && item.children.length > 0;

          return (
            <div key={item.href}>
              <Link
                href={hasChildren ? '#' : item.href}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors',
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.title}</span>
              </Link>

              {/* Submódulos */}
              {hasChildren && isActive && (
                <div className="ml-4 mt-2 space-y-1">
                  {item.children
                    ?.filter((child) => child.roles.includes(userRole))
                    .map((child) => {
                      const isChildActive = pathname === child.href;
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          className={cn(
                            'flex items-center space-x-3 px-4 py-2 rounded-lg text-sm transition-colors',
                            isChildActive
                              ? 'bg-blue-700 text-white'
                              : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                          )}
                        >
                          <child.icon className="w-4 h-4" />
                          <span>{child.title}</span>
                        </Link>
                      );
                    })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
        <p>Sistema ERP v1.0</p>
        <p>© {new Date().getFullYear()}</p>
      </div>
    </aside>
  );
}
