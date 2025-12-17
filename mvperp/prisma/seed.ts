// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Iniciando seed de datos...");

  // 1. Crear una compañía de prueba
  const company = await prisma.company.upsert({
    where: { rfc: "XAXX010101000" },
    update: {},
    create: {
      name: "Empresa de Prueba",
      rfc: "XAXX010101000",
      regime: "601",
      street: "Calle de Prueba",
      exteriorNumber: "123",
      interiorNumber: "",
      neighborhood: "Centro",
      postalCode: "00000",
      city: "Ciudad de México",
      state: "CDMX",
      municipality: "Benito Juárez",
      country: "México",
      email: "contacto@empresaprueba.com",
      phone: "5551234567",
      pac: "Facturama",
      pacUser: "usuario_pac",
      pacPass: "contraseña_pac",
      testMode: true,
    },
  });

  console.log(`✅ Compañía creada: ${company.name}`);

  // 2. Crear usuario admin - CORRECTO con restricción compuesta
  const hashedPassword = await bcrypt.hash("123456", 10);

  const user = await prisma.user.upsert({
    where: {
      companyId_email: {
        companyId: company.id,
        email: "admin@example.com",
      },
    },
    update: {
      password: hashedPassword, // Actualiza la contraseña si el usuario ya existe
    },
    create: {
      email: "admin@example.com",
      password: hashedPassword,
      name: "Administrador",
      companyId: company.id, // ← AÑADIDO companyId
    },
  });

  console.log(`✅ Usuario creado: ${user.email}`);

  // 3. Crear producto de prueba - CORRECTO con companyId
  const product = await prisma.product.create({
    data: {
      userId: user.id,
      companyId: company.id, // ← AÑADIDO companyId
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
      ivaIncluded: true,
      satKey: "50101500",
      satUnitKey: "H87",
      barcode: "7501234567890",
      category: "Electrónicos",
      brand: "Marca Prueba",
      description: "Producto de prueba para desarrollo",
      location: "Almacén A",
      minimumQuantity: 5.0,
    },
  });

  console.log(`✅ Producto creado: ${product.name}`);

  // 4. Crear variantes
  await prisma.variant.createMany({
    data: [
      { productId: product.id, type: "color", value: "rojo" },
      { productId: product.id, type: "color", value: "azul" },
      { productId: product.id, type: "color", value: "verde" },
      { productId: product.id, type: "tamaño", value: "S" },
      { productId: product.id, type: "tamaño", value: "M" },
      { productId: product.id, type: "tamaño", value: "L" },
      { productId: product.id, type: "tamaño", value: "XL" },
    ],
  });

  console.log("✅ Variantes creadas");

  // 5. Crear listas de precios
  await prisma.priceList.createMany({
    data: [
      { productId: product.id, name: "Retail", price: 100.0 },
      { productId: product.id, name: "Mayoreo (10+)", price: 90.0 },
      { productId: product.id, name: "Distribuidor (50+)", price: 80.0 },
      { productId: product.id, name: "Promoción", price: 85.0 },
    ],
  });

  console.log("✅ Listas de precios creadas");

  // 6. Crear movimiento de inventario
  await prisma.movement.create({
    data: {
      productId: product.id,
      userId: user.id,
      type: "entrada",
      quantity: 10.0,
      previousStock: 0.0,
      newStock: 10.0,
      note: "Carga inicial de inventario",
    },
  });

  console.log("✅ Movimiento de inventario creado");

  // 7. Crear cliente de prueba - CORRECTO con companyId
  const customer = await prisma.customer.create({
    data: {
      name: "Cliente de Prueba",
      email: "cliente@example.com",
      phone: "5559876543",
      rfc: "CUS123456789",
      razonSocial: "Cliente de Prueba S.A. de C.V.",
      taxRegime: "601",
      usoCFDI: "G03",
      address: "Calle Cliente 456",
      fiscalStreet: "Calle Fiscal 456",
      fiscalExteriorNumber: "456",
      fiscalNeighborhood: "Centro",
      fiscalPostalCode: "00100",
      fiscalCity: "Ciudad de México",
      fiscalState: "CDMX",
      fiscalMunicipality: "Cuauhtémoc",
      fiscalCountry: "México",
      companyId: company.id, // ← AÑADIDO companyId
    },
  });

  console.log(`✅ Cliente creado: ${customer.name}`);

  // 8. Crear proveedor de prueba - CORRECTO con companyId
  const supplier = await prisma.supplier.create({
    data: {
      name: "Proveedor de Prueba",
      contactName: "Juan Proveedor",
      email: "proveedor@example.com",
      phone: "5554567890",
      rfc: "PRO123456789",
      street: "Calle Proveedor 789",
      neighborhood: "Industrial",
      postalCode: "00200",
      city: "Ciudad de México",
      state: "CDMX",
      municipality: "Gustavo A. Madero",
      companyId: company.id, // ← AÑADIDO companyId
    },
  });

  console.log(`✅ Proveedor creado: ${supplier.name}`);

  // 9. Crear una venta de prueba - CORRECTO con companyId
  const sale = await prisma.sale.create({
    data: {
      customerId: customer.id,
      userId: user.id,
      companyId: company.id, // ← AÑADIDO companyId
      totalAmount: 200.0,
      status: "completed",
      notes: "Venta de prueba",
      saleItems: {
        create: [
          {
            productId: product.id,
            quantity: 2.0,
            unitPrice: 100.0,
            totalPrice: 200.0,
            description: "Producto de prueba - 2 unidades",
            satProductKey: "50101500",
            satUnitKey: "H87",
          },
        ],
      },
    },
  });

  console.log(`✅ Venta creada: ${sale.id}`);

  // 10. Crear una cotización de prueba - CORRECTO con companyId
  const quotation = await prisma.quotation.create({
    data: {
      customerId: customer.id,
      userId: user.id,
      companyId: company.id, // ← AÑADIDO companyId
      expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 días
      totalAmount: 300.0,
      status: "pending",
      notes: "Cotización de prueba",
      quotationItems: {
        create: [
          {
            productId: product.id,
            quantity: 3.0,
            unitPrice: 100.0,
            totalPrice: 300.0,
            description: "Producto de prueba - 3 unidades",
            satProductKey: "50101500",
            satUnitKey: "H87",
          },
        ],
      },
    },
  });

  console.log(`✅ Cotización creada: ${quotation.id}`);

  // 11. Crear una compra de prueba - CORRECTO con companyId
  const purchase = await prisma.purchase.create({
    data: {
      supplierId: supplier.id,
      userId: user.id,
      companyId: company.id, // ← AÑADIDO companyId
      totalAmount: 700.0,
      status: "completed",
      notes: "Compra de prueba",
      purchaseItems: {
        create: [
          {
            productId: product.id,
            quantity: 10.0,
            unitPrice: 70.0,
            totalPrice: 700.0,
          },
        ],
      },
    },
  });

  console.log(`✅ Compra creada: ${purchase.id}`);

  console.log("🎉 Seed completado exitosamente!");
}

main()
  .catch((e) => {
    console.error("❌ Error en seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
