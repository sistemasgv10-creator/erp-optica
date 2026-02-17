import { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { compare } from 'bcryptjs';
import prisma from './db';
import { Role } from '@prisma/client';

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 días
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Credenciales inválidas');
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
        });

        if (!user || !user.active) {
          throw new Error('Usuario no encontrado o inactivo');
        }

        const isPasswordValid = await compare(credentials.password, user.password);

        if (!isPasswordValid) {
          throw new Error('Contraseña incorrecta');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      // Redirección personalizada según el rol
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};

// Función helper para obtener la ruta del dashboard según el rol
export function getDashboardRouteForRole(role: Role): string {
  const routeMap: Record<Role, string> = {
    SUPER_ADMIN: '/admin',
    ADMIN_DISTRIBUIDORA: '/distribuidora',
    VENDEDOR: '/distribuidora/ventas',
    ALMACEN_BENEFICENCIA: '/almacen/beneficencia',
    ALMACEN_SEDENA: '/almacen/sedena',
    ALMACEN_PT: '/almacen/pt',
    PRODUCCION: '/produccion',
  };

  return routeMap[role] || '/';
}

// Función helper para verificar permisos
export function hasPermission(userRole: Role, allowedRoles: Role[]): boolean {
  // SUPER_ADMIN siempre tiene permiso
  if (userRole === Role.SUPER_ADMIN) return true;
  return allowedRoles.includes(userRole);
}

// Definición de permisos por módulo
export const modulePermissions = {
  distribuidora: {
    ventas: [Role.SUPER_ADMIN, Role.ADMIN_DISTRIBUIDORA, Role.VENDEDOR],
    hojasViajeras: [Role.SUPER_ADMIN, Role.ADMIN_DISTRIBUIDORA],
    reportes: [Role.SUPER_ADMIN, Role.ADMIN_DISTRIBUIDORA],
    controlVendedor: [Role.SUPER_ADMIN, Role.ADMIN_DISTRIBUIDORA],
  },
  almacen: {
    inventario: [Role.SUPER_ADMIN, Role.ALMACEN_BENEFICENCIA, Role.ALMACEN_SEDENA, Role.ADMIN_DISTRIBUIDORA],
    beneficencia: [Role.SUPER_ADMIN, Role.ALMACEN_BENEFICENCIA],
    sedena: [Role.SUPER_ADMIN, Role.ALMACEN_SEDENA],
    pt: [Role.SUPER_ADMIN, Role.ALMACEN_PT],
    movimientos: [Role.SUPER_ADMIN, Role.ALMACEN_PT],
  },
  produccion: {
    all: [Role.SUPER_ADMIN, Role.PRODUCCION],
  },
  admin: {
    usuarios: [Role.SUPER_ADMIN],
  },
};
