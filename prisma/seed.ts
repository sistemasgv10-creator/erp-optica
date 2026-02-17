import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de la base de datos...');

  // Limpiar datos existentes (opcional - comentar en producción)
  // await prisma.user.deleteMany();
  // await prisma.producto.deleteMany();

  // Crear usuarios del sistema
  const users = [
    {
      email: 'superadmin@optica.com',
      name: 'Super Administrador',
      password: await bcrypt.hash('password123', 10),
      role: Role.SUPER_ADMIN,
    },
    {
      email: 'admin.distribuidora@optica.com',
      name: 'Admin Distribuidora',
      password: await bcrypt.hash('password123', 10),
      role: Role.ADMIN_DISTRIBUIDORA,
    },
    {
      email: 'vendedor@optica.com',
      name: 'Juan Vendedor',
      password: await bcrypt.hash('password123', 10),
      role: Role.VENDEDOR,
    },
    {
      email: 'almacen.beneficencia@optica.com',
      name: 'María Almacén Beneficencia',
      password: await bcrypt.hash('password123', 10),
      role: Role.ALMACEN_BENEFICENCIA,
    },
    {
      email: 'almacen.sedena@optica.com',
      name: 'Pedro Almacén Sedena',
      password: await bcrypt.hash('password123', 10),
      role: Role.ALMACEN_SEDENA,
    },
    {
      email: 'almacen.pt@optica.com',
      name: 'Ana Producto Terminado',
      password: await bcrypt.hash('password123', 10),
      role: Role.ALMACEN_PT,
    },
    {
      email: 'produccion@optica.com',
      name: 'Carlos Producción',
      password: await bcrypt.hash('password123', 10),
      role: Role.PRODUCCION,
    },
  ];

  console.log('👥 Creando usuarios...');
  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`✅ Usuario creado: ${user.email}`);
  }

  // Crear productos de ejemplo
  const productos = [
    {
      codigo: 'LENTE-001',
      nombre: 'Lente Monofocal CR-39',
      descripcion: 'Lente monofocal en material CR-39, tratamiento antireflejo',
      categoria: 'LENTES',
      stockMinimo: 50,
      unidadMedida: 'PIEZA',
    },
    {
      codigo: 'LENTE-002',
      nombre: 'Lente Bifocal',
      descripcion: 'Lente bifocal para visión cercana y lejana',
      categoria: 'LENTES',
      stockMinimo: 30,
      unidadMedida: 'PIEZA',
    },
    {
      codigo: 'LENTE-003',
      nombre: 'Lente Progresivo',
      descripcion: 'Lente progresivo de alta gama',
      categoria: 'LENTES',
      stockMinimo: 20,
      unidadMedida: 'PIEZA',
    },
    {
      codigo: 'ARM-001',
      nombre: 'Armazón Metálico Adulto',
      descripcion: 'Armazón metálico para adulto, color dorado',
      categoria: 'ARMAZONES',
      stockMinimo: 25,
      unidadMedida: 'PIEZA',
    },
    {
      codigo: 'ARM-002',
      nombre: 'Armazón Plástico Niño',
      descripcion: 'Armazón plástico flexible para niño',
      categoria: 'ARMAZONES',
      stockMinimo: 30,
      unidadMedida: 'PIEZA',
    },
    {
      codigo: 'ACC-001',
      nombre: 'Estuche Rígido',
      descripcion: 'Estuche rígido para lentes',
      categoria: 'ACCESORIOS',
      stockMinimo: 100,
      unidadMedida: 'PIEZA',
    },
    {
      codigo: 'ACC-002',
      nombre: 'Paño de Limpieza',
      descripcion: 'Paño de microfibra para limpieza de lentes',
      categoria: 'ACCESORIOS',
      stockMinimo: 200,
      unidadMedida: 'PIEZA',
    },
    {
      codigo: 'INS-001',
      nombre: 'Tornillos para Armazón',
      descripcion: 'Set de tornillos variados para reparación',
      categoria: 'INSUMOS',
      stockMinimo: 50,
      unidadMedida: 'SET',
    },
  ];

  console.log('📦 Creando productos...');
  for (const producto of productos) {
    await prisma.producto.upsert({
      where: { codigo: producto.codigo },
      update: {},
      create: producto,
    });
    console.log(`✅ Producto creado: ${producto.codigo} - ${producto.nombre}`);
  }

  // Crear inventario inicial para cada producto
  console.log('📊 Creando inventario inicial...');
  const productosCreados = await prisma.producto.findMany();

  for (const producto of productosCreados) {
    await prisma.inventario.upsert({
      where: {
        productoId_ubicacion: {
          productoId: producto.id,
          ubicacion: 'ALMACEN-PRINCIPAL',
        },
      },
      update: {},
      create: {
        productoId: producto.id,
        cantidad: Math.floor(Math.random() * 100) + 50, // Entre 50 y 150
        ubicacion: 'ALMACEN-PRINCIPAL',
        lote: `LOTE-${new Date().getFullYear()}-${Math.floor(Math.random() * 1000)}`,
      },
    });
  }
  console.log('✅ Inventario inicial creado');

  console.log('');
  console.log('🎉 Seed completado exitosamente!');
  console.log('');
  console.log('👤 Usuarios creados:');
  console.log('━'.repeat(80));
  console.log('Email                              | Rol                    | Password');
  console.log('━'.repeat(80));
  users.forEach((user) => {
    const paddedEmail = user.email.padEnd(34);
    const paddedRole = user.role.padEnd(22);
    console.log(`${paddedEmail} | ${paddedRole} | password123`);
  });
  console.log('━'.repeat(80));
  console.log('');
  console.log('💡 Para iniciar sesión, usa cualquiera de los emails de arriba con password: password123');
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
