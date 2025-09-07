// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  // Crear usuario de prueba
  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Admin",
    },
  });

  // Crear producto de prueba
  const product = await prisma.product.create({
    data: {
      userId: user.id,
      name: "Producto de prueba",
      type: "producto",
      sku: "PROD-001",
      sellAtPOS: true,
      includeInCatalog: true,
      useStock: true,
      quantity: 10.0,
      price: 100.0,
      cost: 70.0,
      stock: 10.0,
      iva: 16.0,
      ieps: 0.0,
    },
  });

  // Crear variantes
  await prisma.variant.createMany({
    data: [
      { productId: product.id, type: "color", value: "rojo" },
      { productId: product.id, type: "tamaño", value: "XL" },
    ],
  });

  // Crear listas de precios
  await prisma.priceList.createMany({
    data: [
      { productId: product.id, name: "Retail", price: 100.0 },
      { productId: product.id, name: "Mayoreo", price: 90.0 },
    ],
  });

  // Crear movimiento de inventario
  await prisma.movement.create({
    data: {
      productId: product.id,
      userId: user.id,
      type: "entrada",
      quantity: 10.0,
      previousStock: 0.0,
      newStock: 10.0,
    },
  });

  console.log("✅ Seed completado correctamente");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
