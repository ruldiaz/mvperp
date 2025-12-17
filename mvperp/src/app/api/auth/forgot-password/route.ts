import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendMail } from "@/utils/sendMail";

// 🔥 SOLUCIÓN: Usar aserción de tipo no nulo (!)
const JWT_SECRET = process.env.JWT_SECRET!;

// Validación en runtime por si acaso
if (!JWT_SECRET) {
  console.error("❌ ERROR CRÍTICO: JWT_SECRET no está definido en .env");
  // En desarrollo, puedes usar un valor por defecto
  if (process.env.NODE_ENV === "development") {
    console.warn("⚠️  Usando JWT_SECRET por defecto para desarrollo");
    // En producción esto debería fallar
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verificar JWT_SECRET al inicio de la función también
    if (!JWT_SECRET) {
      return NextResponse.json(
        { error: "Error de configuración del servidor" },
        { status: 500 }
      );
    }

    const { email } = await req.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Buscar usuario usando findFirst
    const user = await prisma.user.findFirst({
      where: {
        email: email.toLowerCase().trim(),
      },
    });

    // Por seguridad, no revelamos si el usuario existe o no
    if (!user) {
      return NextResponse.json(
        {
          message:
            "Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en unos minutos.",
        },
        { status: 200 }
      );
    }

    // Verificar que el usuario tenga email
    if (!user.email) {
      return NextResponse.json(
        {
          message:
            "Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en unos minutos.",
        },
        { status: 200 }
      );
    }

    // 🔥 AHORA JWT_SECRET es string (no string | undefined)
    // Crear token de restablecimiento
    const resetToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        type: "password_reset",
      },
      JWT_SECRET,
      {
        // ← TypeScript sabe que es string
        expiresIn: "15m",
      }
    );

    // Crear URL de restablecimiento
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
    const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

    // Enviar email
    try {
      await sendMail(
        user.email,
        "Restablecer tu contraseña",
        `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Restablecimiento de Contraseña</h2>
          <p>Hola ${user.name || "usuario"},</p>
          <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta.</p>
          <p>Haz clic en el siguiente enlace para crear una nueva contraseña:</p>
          <div style="text-align: center; margin: 20px 0;">
            <a href="${resetUrl}" 
               style="background-color: #0070f3; color: white; padding: 12px 24px; 
                      text-decoration: none; border-radius: 4px; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p>O copia y pega este enlace en tu navegador:</p>
          <p style="background-color: #f5f5f5; padding: 10px; border-radius: 4px; 
                     word-break: break-all; font-size: 12px;">
            ${resetUrl}
          </p>
          <p><strong>Este enlace solo es válido por 15 minutos.</strong></p>
          <p>Si no solicitaste restablecer tu contraseña, puedes ignorar este mensaje.</p>
        </div>
        `
      );
    } catch (emailError) {
      console.error("Error enviando email de restablecimiento:", emailError);
      // Continuar sin fallar la petición
    }

    // Registrar en consola (solo desarrollo)
    if (process.env.NODE_ENV === "development") {
      console.log(`🔐 Token de restablecimiento para ${user.email}`);
      console.log(`🔗 URL: ${resetUrl}`);
    }

    return NextResponse.json({
      message:
        "Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en unos minutos.",
    });
  } catch (error: unknown) {
    console.error("Error en forgot-password:", error);

    return NextResponse.json(
      {
        message:
          "Si el email existe en nuestro sistema, recibirás un enlace para restablecer tu contraseña en unos minutos.",
      },
      { status: 200 }
    );
  }
}
