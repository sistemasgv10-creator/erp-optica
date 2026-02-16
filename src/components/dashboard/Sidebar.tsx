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
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Role } from '@prisma/client';
import { useState, useEffect } from 'react';

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
  const [isExpanded, setIsExpanded] = useState(true);
  const [expandedSections, setExpandedSections] = useState<string[]>([]);

  // Cargar estado guardado del localStorage al iniciar
  useEffect(() => {
    const savedState = localStorage.getItem('sidebar-expanded');
    if (savedState !== null) {
      setIsExpanded(savedState === 'true');
    }
  }, []);

  // Guardar estado en localStorage cuando cambie
  useEffect(() => {
    localStorage.setItem('sidebar-expanded', isExpanded.toString());
  }, [isExpanded]);

  const toggleSidebar = () => {
    setIsExpanded(!isExpanded);
  };

  const toggleSection = (href: string) => {
    setExpandedSections(prev =>
      prev.includes(href)
        ? prev.filter(item => item !== href)
        : [...prev, href]
    );
  };

  const filteredNav = navigation.filter((item) => item.roles.includes(userRole));

  return (
    <aside className={cn(
      "bg-gray-900 text-white min-h-screen flex flex-col transition-all duration-300 relative",
      isExpanded ? "w-64" : "w-20"
    )}>
      {/* Botón para colapsar/expandir */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 bg-gray-800 hover:bg-gray-700 text-white rounded-full p-1 border border-gray-700 z-10"
      >
        {isExpanded ? (
          <ChevronLeft className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </button>
      {/* Logo */}
      <div className="p-6 border-b border-gray-800">
        <Link href="" className="flex items-center justify-center">
          <img
            src="/images/logVision10.png"
            alt="Vision10 Logo"
            className="w-auto h-12 object-contain"
          />
        </Link>
      </div>
      {/* Navegación */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {filteredNav.map((item) => {
          const isActive = pathname.startsWith(item.href);
          const hasChildren = item.children && item.children.length > 0;
          const isSectionExpanded = expandedSections.includes(item.href);

          return (
            <div key={item.href}>
              <div
                onClick={() => hasChildren && toggleSection(item.href)}
                className={cn(
                  'flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors cursor-pointer',
                  isActive && !hasChildren
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                )}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {isExpanded && (
                  <>
                    <span className="font-medium flex-1">{item.title}</span>
                    {hasChildren && (
                      <ChevronRight className={cn(
                        "w-4 h-4 transition-transform",
                        isSectionExpanded && "transform rotate-90"
                      )} />
                    )}
                  </>
                )}
              </div>

              {/* Submódulos */}
              {hasChildren && isExpanded && isSectionExpanded && (
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
                          <child.icon className="w-4 h-4 flex-shrink-0" />
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
      {isExpanded && (
        <div className="p-4 border-t border-gray-800 text-xs text-gray-400">
          <p>Sistema-Vision10 v1.0</p>
          <p>© {new Date().getFullYear()}</p>
        </div>
      )}
    </aside>
  );
}