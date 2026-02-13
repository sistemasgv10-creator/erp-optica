# Sistema ERP Óptica

Sistema de gestión empresarial para empresa óptica con módulos de Distribuidora, Almacén y Producción.

## 🚀 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript
- **Base de Datos**: MySQL
- **ORM**: Prisma
- **Autenticación**: NextAuth.js
- **UI**: Tailwind CSS + shadcn/ui
- **Estado**: Zustand
- **Validación**: Zod
- **Exportación**: xlsx (SheetJS)
- **PDF**: react-pdf

## 📋 Requisitos Previos

- Node.js 18.x o superior
- MySQL 8.0 o superior
- npm o pnpm

## 🛠️ Instalación

1. Clonar el repositorio
```bash
git clone [url-del-repo]
cd erp-optica
```

2. Instalar dependencias
```bash
npm install
```

3. Configurar variables de entorno
```bash
cp .env.example .env
```

Editar `.env` con tus credenciales:
```
DATABASE_URL="mysql://usuario:password@localhost:3306/erp_optica"
NEXTAUTH_SECRET="tu-secret-key-super-seguro"
NEXTAUTH_URL="http://localhost:3000"
```

4. Crear la base de datos
```bash
npx prisma db push
```

5. Crear usuarios iniciales
```bash
npx prisma db seed
```

6. Iniciar el servidor de desarrollo
```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000)

## 👥 Usuarios del Sistema

### Módulo Distribuidora
- **Usuario 1** (Administrador Distribuidora)
  - Ventas, hojas viajeras, reportes, control de Usuario 2
- **Usuario 2** (Vendedor)
  - Control de ventas propio

### Módulo Almacén
- **Usuario 3** (Almacenista Beneficencia)
  - Inventario completo, Beneficencia y Garantías
- **Usuario 4** (Almacenista Sedena)
  - Sedena y Sedena Garantías
- **Usuario 5** (Embarques y Movimientos)
  - PT, Embarques, Movimientos de armazones

### Módulo Producción
- **Usuario 6** (Producción Completa)
  - Control de Tallado, Bisel, Calidad

## 📁 Estructura del Proyecto

```
erp-optica/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   └── login/
│   │   ├── (dashboard)/
│   │   │   ├── distribuidora/
│   │   │   ├── almacen/
│   │   │   └── produccion/
│   │   ├── api/
│   │   └── layout.tsx
│   ├── components/
│   │   ├── ui/
│   │   ├── dashboard/
│   │   └── modules/
│   ├── lib/
│   │   ├── auth.ts
│   │   ├── db.ts
│   │   └── utils.ts
│   └── types/
├── public/
└── package.json
```

## 🔒 Roles y Permisos

El sistema implementa control de acceso basado en roles (RBAC):
- Cada usuario tiene un rol específico
- Los módulos se cargan dinámicamente según el rol
- Las rutas están protegidas con middleware

## 📊 Flujo del Sistema

1. **Login** → Redirección según rol
2. **Distribuidora** → Crea hojas viajeras → Almacén
3. **Almacén** → Verifica inventario → Producción
4. **Producción** → Tallado/Bisel/Calidad → PT
5. **PT** → Embarque → Entrega

## 🧪 Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Iniciar producción
npm run lint         # Linter
npm run prisma:studio # Ver BD en navegador
```

## 📝 Notas Importantes

- El sistema actualiza inventario automáticamente al surtir
- Las mermas se descuentan del inventario en tiempo real
- Los reportes se generan en Excel con filtros por fecha
- Las hojas viajeras se imprimen en PDF
- El sistema notifica cambios de estatus entre módulos
