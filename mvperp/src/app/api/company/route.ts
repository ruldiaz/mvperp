// app/api/company/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import { CompanyResponse, Company } from "@/types/company";
import { Company as PrismaCompany } from "@prisma/client";

const JWT_SECRET = process.env.JWT_SECRET;

// Función de mapeo con tipo seguro
function mapToCompany(prismaCompany: PrismaCompany): Company {
  return {
    id: prismaCompany.id,
    name: prismaCompany.name,
    rfc: prismaCompany.rfc,
    regime: prismaCompany.regime,
    csdCert: prismaCompany.csdCert,
    csdKey: prismaCompany.csdKey,
    csdPassword: prismaCompany.csdPassword,
    street: prismaCompany.street,
    exteriorNumber: prismaCompany.exteriorNumber,
    interiorNumber: prismaCompany.interiorNumber,
    neighborhood: prismaCompany.neighborhood,
    postalCode: prismaCompany.postalCode,
    city: prismaCompany.city,
    state: prismaCompany.state,
    municipality: prismaCompany.municipality,
    country: prismaCompany.country,
    email: prismaCompany.email,
    phone: prismaCompany.phone,
    pac: prismaCompany.pac,
    pacUser: prismaCompany.pacUser,
    pacPass: prismaCompany.pacPass,
    testMode: prismaCompany.testMode,
    createdAt: prismaCompany.createdAt,
    updatedAt: prismaCompany.updatedAt,
  };
}

// ✅ Exportar named exports para cada método HTTP
export async function GET(
  req: NextRequest
): Promise<NextResponse<CompanyResponse>> {
  if (!JWT_SECRET) {
    return NextResponse.json(
      { error: "JWT secret no definido", company: null },
      { status: 500 }
    );
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "No autenticado", company: null },
      { status: 401 }
    );
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name?: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { 
        company: {
          select: {
            id: true,
            name: true,
            rfc: true,
            regime: true,
            csdCert: true,
            csdKey: true,
            csdPassword: true,
            street: true,
            exteriorNumber: true,
            interiorNumber: true, // ✅ Incluir explícitamente
            neighborhood: true,
            postalCode: true,
            city: true,
            state: true,
            municipality: true,
            country: true,
            email: true,
            phone: true,
            pac: true,
            pacUser: true,
            pacPass: true,
            testMode: true,
            createdAt: true,
            updatedAt: true,
          }
        } 
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado", company: null },
        { status: 404 }
      );
    }

    const company = user.company ? mapToCompany(user.company) : null;
    return NextResponse.json({ company });
  } catch (error) {
    console.error("Error al obtener compañía:", error);
    return NextResponse.json(
      { error: "Token inválido o expirado", company: null },
      { status: 401 }
    );
  }
}

// ✅ Exportar named export para POST
export async function POST(
  req: NextRequest
): Promise<NextResponse<CompanyResponse>> {
  if (!JWT_SECRET) {
    return NextResponse.json(
      { error: "JWT secret no definido", company: null },
      { status: 500 }
    );
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json(
      { error: "No autenticado", company: null },
      { status: 401 }
    );
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name?: string;
    };

    const data = await req.json();

    // ✅ Validate production mode requirements
    if (data.testMode === false) {
      // Check if production credentials are configured
      if (!process.env.FACTURAMA_PROD_USERNAME || 
          !process.env.FACTURAMA_PROD_PASSWORD) {
        return NextResponse.json(
          {
            error: "No se puede activar el modo producción",
            details: "Las credenciales de Facturama para producción no están configuradas en el servidor. " +
                     "Contacte al administrador del sistema para configurar FACTURAMA_PROD_USERNAME y FACTURAMA_PROD_PASSWORD.",
            company: null,
          },
          { status: 400 }
        );
      }

      // Check if CSD certificates are uploaded
      const userWithCompany = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: { company: true },
      });

      if (!userWithCompany?.company?.csdCert || 
          !userWithCompany?.company?.csdKey || 
          !userWithCompany?.company?.csdPassword) {
        return NextResponse.json(
          {
            error: "No se puede activar el modo producción",
            details: "Debe cargar y validar los certificados CSD antes de activar el modo producción. " +
                     "Suba su certificado (.cer), llave privada (.key) y contraseña en la sección de Certificado de Sello Digital.",
            company: null,
          },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado", company: null },
        { status: 404 }
      );
    }

    // Validar datos requeridos
    const requiredFields = [
      "name",
      "rfc",
      "regime",
      "street",
      "exteriorNumber",
      "neighborhood",
      "postalCode",
      "city",
      "state",
      "municipality",
    ];

    const missingFields = requiredFields.filter((field) => !data[field]);
    if (missingFields.length > 0) {
      return NextResponse.json(
        {
          error: `Faltan campos requeridos: ${missingFields.join(", ")}`,
          company: null,
        },
        { status: 400 }
      );
    }

    let prismaCompany;

    if (user.companyId) {
      prismaCompany = await prisma.company.update({
        where: { id: user.companyId },
        data: {
          ...data,
          interiorNumber: data.interiorNumber || null,
          country: data.country || "México",
          updatedAt: new Date(),
        },
      });
    } else {
      prismaCompany = await prisma.company.create({
        data: {
          ...data,
          interiorNumber: data.interiorNumber || null,
          country: data.country || "México",
          users: {
            connect: { id: user.id },
          },
        },
      });

      await prisma.user.update({
        where: { id: user.id },
        data: { companyId: prismaCompany.id },
      });
    }

    // Obtener la compañía completa con todos los campos
    const completeCompany = await prisma.company.findUnique({
      where: { id: prismaCompany.id },
      select: {
        id: true,
        name: true,
        rfc: true,
        regime: true,
        csdCert: true,
        csdKey: true,
        csdPassword: true,
        street: true,
        exteriorNumber: true,
        interiorNumber: true,
        neighborhood: true,
        postalCode: true,
        city: true,
        state: true,
        municipality: true,
        country: true,
        email: true,
        phone: true,
        pac: true,
        pacUser: true,
        pacPass: true,
        testMode: true,
        createdAt: true,
        updatedAt: true,
      }
    });

    if (!completeCompany) {
      return NextResponse.json(
        { error: "Error al obtener la compañía actualizada", company: null },
        { status: 500 }
      );
    }

    const companyResult = mapToCompany(completeCompany);
    return NextResponse.json({ company: companyResult });
  } catch (error) {
    console.error("Error al guardar compañía:", error);

    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { error: "Token inválido o expirado", company: null },
        { status: 401 }
      );
    }

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "El RFC ya está registrado", company: null },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Error interno del servidor", company: null },
      { status: 500 }
    );
  }
}

// ✅ También puedes exportar otros métodos si los necesitas
export async function PUT() {
  return NextResponse.json(
    { error: "Método no implementado" },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: "Método no implementado" },
    { status: 405 }
  );
}