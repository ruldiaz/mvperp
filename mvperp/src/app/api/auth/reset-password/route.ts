import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: NextRequest) {
  try {
    const { token, password } = await req.json();

    const payload = jwt.verify(token, JWT_SECRET) as { userId: string };

    const hashed = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: payload.userId },
      data: { password: hashed },
    });

    return NextResponse.json({ message: "Contraseña actualizada con éxito" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Token inválido o expirado" },
      { status: 400 }
    );
  }
}
