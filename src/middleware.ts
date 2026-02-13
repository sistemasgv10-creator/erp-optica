import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { getDashboardRouteForRole } from './lib/auth';

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Si no hay token, redirigir a login
    if (!token) {
      return NextResponse.redirect(new URL('/login', req.url));
    }

    // Redirección después de login exitoso
    if (pathname === '/') {
      const dashboardRoute = getDashboardRouteForRole(token.role);
      return NextResponse.redirect(new URL(dashboardRoute, req.url));
    }

    // Verificar permisos de acceso a módulos
    const role = token.role;

    // Distribuidora
    if (pathname.startsWith('/distribuidora')) {
      if (!['ADMIN_DISTRIBUIDORA', 'VENDEDOR'].includes(role)) {
        return NextResponse.redirect(new URL(getDashboardRouteForRole(role), req.url));
      }
      // El vendedor solo puede acceder a su módulo de ventas
      if (role === 'VENDEDOR' && !pathname.startsWith('/distribuidora/ventas')) {
        return NextResponse.redirect(new URL('/distribuidora/ventas', req.url));
      }
    }

    // Almacén
    if (pathname.startsWith('/almacen')) {
      const almacenRoles = ['ALMACEN_BENEFICENCIA', 'ALMACEN_SEDENA', 'ALMACEN_PT'];
      if (!almacenRoles.includes(role)) {
        return NextResponse.redirect(new URL(getDashboardRouteForRole(role), req.url));
      }

      // Verificar acceso específico por submódulo
      if (pathname.startsWith('/almacen/beneficencia') && role !== 'ALMACEN_BENEFICENCIA') {
        return NextResponse.redirect(new URL(getDashboardRouteForRole(role), req.url));
      }
      if (pathname.startsWith('/almacen/sedena') && role !== 'ALMACEN_SEDENA') {
        return NextResponse.redirect(new URL(getDashboardRouteForRole(role), req.url));
      }
      if (pathname.startsWith('/almacen/pt') && role !== 'ALMACEN_PT') {
        return NextResponse.redirect(new URL(getDashboardRouteForRole(role), req.url));
      }
    }

    // Producción
    if (pathname.startsWith('/produccion')) {
      if (role !== 'PRODUCCION') {
        return NextResponse.redirect(new URL(getDashboardRouteForRole(role), req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
    pages: {
      signIn: '/login',
    },
  }
);

export const config = {
  matcher: [
    '/',
    '/distribuidora/:path*',
    '/almacen/:path*',
    '/produccion/:path*',
  ],
};
