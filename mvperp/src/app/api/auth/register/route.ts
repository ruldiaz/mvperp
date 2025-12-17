import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

// Función para validar formato de RFC
function validateRfc(rfc: string): boolean {
  // Patrones de RFC válidos:
  // - Persona física: 4 letras + 6 números + 3 caracteres (13 caracteres)
  // - Persona moral: 3 letras + 6 números + 3 caracteres (12 caracteres)
  const rfcRegex =
    /^([A-ZÑ&]{3,4})(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01]))([A-Z\d]{2}[A\d])$/;
  return rfcRegex.test(rfc.toUpperCase());
}

interface RegisterRequestBody {
  email: string;
  password: string;
  name?: string;
  companyName?: string;
  companyRfc?: string;
}

interface PrismaError extends Error {
  code?: string;
  meta?: {
    target?: string[];
  };
}

function isPrismaError(error: unknown): error is PrismaError {
  return error instanceof Error && "code" in error && "meta" in error;
}

export async function POST(req: NextRequest) {
  if (!JWT_SECRET) {
    return NextResponse.json(
      { error: "JWT secret no definido" },
      { status: 500 }
    );
  }

  try {
    const body: RegisterRequestBody = await req.json();
    const { email, password, name, companyName, companyRfc } = body;

    // Validaciones obligatorias
    if (!email || !password || !companyRfc) {
      return NextResponse.json(
        { error: "Email, contraseña y RFC de empresa son obligatorios" },
        { status: 400 }
      );
    }

    // Validar formato de RFC
    if (!validateRfc(companyRfc)) {
      return NextResponse.json(
        {
          error:
            "RFC inválido. Formato correcto: 12 caracteres (moral) o 13 caracteres (física)",
        },
        { status: 400 }
      );
    }

    // Convertir RFC a mayúsculas (estándar SAT)
    const formattedRfc = companyRfc.toUpperCase();

    // Verificar si el RFC ya existe
    const existingCompany = await prisma.company.findUnique({
      where: { rfc: formattedRfc },
    });

    if (existingCompany) {
      return NextResponse.json(
        { error: "Ya existe una empresa registrada con este RFC" },
        { status: 400 }
      );
    }

    // Verificar si el email ya existe
    const existingUser = await prisma.user.findFirst({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email ya registrado" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name: name || email.split("@")[0],
        company: {
          create: {
            name: companyName || name || "Mi empresa",
            rfc: formattedRfc,
            regime: "601", // General de Ley Personas Morales (por defecto)
            street: "Por definir",
            exteriorNumber: "S/N",
            interiorNumber: "",
            neighborhood: "Por definir",
            postalCode: "00000",
            city: "Por definir",
            state: "Por definir",
            municipality: "Por definir",
            country: "México",
            email: email.toLowerCase(),
            phone: "",
            testMode: true, // Modo pruebas por defecto
          },
        },
      },
      include: {
        company: true,
      },
    });

    const companyId = user.company!.id;

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        name: user.name,
        companyId,
      },
      JWT_SECRET,
      { expiresIn: "7d" } // Token válido por 7 días
    );

    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          companyId,
        },
        company: {
          id: user.company!.id,
          name: user.company!.name,
          rfc: user.company!.rfc,
        },
      },
      { status: 201 }
    );

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60, // 7 días
    });

    return response;
  } catch (error: unknown) {
    console.error("REGISTER ERROR:", error);

    // Manejo específico de errores de Prisma
    if (isPrismaError(error)) {
      if (error.code === "P2002") {
        const field = error.meta?.target?.[0];
        if (field === "rfc") {
          return NextResponse.json(
            { error: "El RFC de la empresa ya está registrado" },
            { status: 400 }
          );
        }
        if (field === "email") {
          return NextResponse.json(
            { error: "El email ya está registrado" },
            { status: 400 }
          );
        }
      }
    }

    return NextResponse.json(
      { error: "Error en el servidor" },
      { status: 500 }
    );
  }
}
