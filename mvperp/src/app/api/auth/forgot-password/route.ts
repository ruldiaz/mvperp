import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { sendMail } from "@/utils/sendMail";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  const { email } = await req.json();

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return NextResponse.json(
      { message: "Si el email existe, se enviará un link" },
      { status: 200 }
    );
  }

  const resetToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
    expiresIn: "15m",
  });

  const resetUrl = `http://localhost:3000/reset-password?token=${resetToken}`;

  // 👇 Usamos la función utilitaria
  await sendMail(
    user.email,
    "Restablecer tu contraseña",
    `<p>Haz clic en el siguiente enlace para restablecer tu contraseña:</p>
     <a href="${resetUrl}">${resetUrl}</a>
     <p>Este enlace solo es válido por 15 minutos.</p>`
  );

  return NextResponse.json({
    message: "Si el email existe, se enviará un link",
  });
}
