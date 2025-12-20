// app/api/company/certificates/route.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { prisma } from "@/lib/prisma";
import forge from "node-forge";
import crypto from "crypto";

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Valida que el CSD (Certificado de Sello Digital) sea válido, vigente,
 * que la llave privada coincida y que el RFC coincida con el de la empresa.
 */
function validateCsd(
  cerBase64: string,
  keyBase64: string,
  password: string,
  expectedRfc: string
): boolean {
  try {
    // ==== 1. Convertir y validar certificado .cer ====
    const certDer = Buffer.from(cerBase64, "base64");
    const certPem = forge.pki.certificateToPem(
      forge.pki.certificateFromAsn1(
        forge.asn1.fromDer(certDer.toString("binary"))
      )
    );
    const cert = forge.pki.certificateFromPem(certPem);

    // ==== 2. Validar vigencia ====
    const now = new Date();
    if (now < cert.validity.notBefore || now > cert.validity.notAfter) {
      throw new Error("El certificado está vencido o no es válido aún");
    }

    // ==== 3. Extraer RFC del certificado ====
    let rfcFromCert: string | undefined;

    // Estrategia 1: x500UniqueIdentifier (OID 2.5.4.45)
    try {
      const uniqueIdField = cert.subject.getField({ type: "2.5.4.45" });
      if (uniqueIdField) {
        rfcFromCert = uniqueIdField.value;
        console.log("RFC encontrado en x500UniqueIdentifier:", rfcFromCert);
      }
    } catch (e) {
      console.error(e);
      // Campo no existe
    }

    // Estrategia 2: serialNumber (OID 2.5.4.5)
    if (!rfcFromCert) {
      try {
        const serialNumberField = cert.subject.getField({ type: "2.5.4.5" });
        if (serialNumberField) {
          rfcFromCert = serialNumberField.value;
          console.log("RFC encontrado en serialNumber:", rfcFromCert);
        }
      } catch (e) {
        console.error(e);
        // Campo no existe
      }
    }

    // Estrategia 3: commonName
    if (!rfcFromCert) {
      try {
        const commonNameField = cert.subject.getField({ name: "commonName" });
        if (commonNameField) {
          const cnValue = commonNameField.value;
          console.log("CommonName encontrado:", cnValue);
          const rfcMatch = cnValue.match(/([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})/);
          if (rfcMatch) {
            rfcFromCert = rfcMatch[1];
            console.log("RFC extraído del CN:", rfcFromCert);
          }
        }
      } catch (e) {
        console.error("Error al buscar CN:", e);
      }
    }

    // Estrategia 4: buscar en todos los campos
    if (!rfcFromCert) {
      console.log("Campos disponibles en el certificado:");
      cert.subject.attributes.forEach((attr) => {
        console.log(`  - ${attr.name || attr.type}: ${attr.value}`);
        if (typeof attr.value === "string") {
          const rfcMatch = attr.value.match(/([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})/);
          if (rfcMatch && !rfcFromCert) {
            rfcFromCert = rfcMatch[1];
            console.log(
              `RFC encontrado en campo ${attr.name || attr.type}:`,
              rfcFromCert
            );
          }
        }
      });
    }

    if (!rfcFromCert) {
      throw new Error(
        "No se pudo extraer el RFC del certificado. Verifica que sea un CSD válido del SAT."
      );
    }

    // Comparar RFC
    const cleanRfcFromCert = rfcFromCert.trim().toUpperCase();
    const cleanExpectedRfc = expectedRfc.trim().toUpperCase();

    if (cleanRfcFromCert !== cleanExpectedRfc) {
      throw new Error(
        `El RFC del certificado (${cleanRfcFromCert}) no coincide con el RFC de la empresa (${cleanExpectedRfc})`
      );
    }

    // ==== 4. Validar llave privada con crypto nativo de Node.js ====
    const keyDer = Buffer.from(keyBase64, "base64");

    console.log("Validando llave privada con crypto nativo...");

    let privateKey: crypto.KeyObject;
    try {
      // Intentar cargar la llave encriptada (PKCS#8)
      privateKey = crypto.createPrivateKey({
        key: keyDer,
        format: "der",
        type: "pkcs8",
        passphrase: password,
      });
      console.log("✓ Llave privada cargada correctamente");
    } catch (e) {
      console.error("Error al cargar llave:", e);
      throw new Error(
        "No se pudo desencriptar la llave privada. Verifica que la contraseña sea correcta."
      );
    }

    // ==== 5. Verificar que certificado y llave corresponden ====
    console.log("Verificando correspondencia entre certificado y llave...");

    try {
      // Crear un mensaje de prueba
      const testData = Buffer.from("prueba de firma CSD", "utf8");

      // Firmar con la llave privada
      const sign = crypto.createSign("SHA256");
      sign.update(testData);
      sign.end();
      const signature = sign.sign(privateKey);

      // Verificar con la llave pública del certificado
      const publicKeyPem = forge.pki.publicKeyToPem(cert.publicKey);
      const publicKey = crypto.createPublicKey(publicKeyPem);

      const verify = crypto.createVerify("SHA256");
      verify.update(testData);
      verify.end();
      const isValid = verify.verify(publicKey, signature);

      if (!isValid) {
        throw new Error(
          "El certificado y la llave privada no pertenecen al mismo par. Verifica que sean archivos correspondientes."
        );
      }

      console.log("✓ Certificado y llave corresponden correctamente");
    } catch (e) {
      if (e instanceof Error && e.message.includes("no pertenecen")) {
        throw e;
      }
      console.error("Error en verificación:", e);
      throw new Error(
        "Error al verificar la correspondencia entre certificado y llave"
      );
    }

    console.log("✓ Validación completa exitosa");
    return true;
  } catch (err) {
    console.error("Error en validación del CSD:", err);
    throw err;
  }
}

export async function POST(req: NextRequest) {
  if (!JWT_SECRET) {
    return NextResponse.json(
      { error: "JWT secret no definido" },
      { status: 500 }
    );
  }

  const token = req.cookies.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET) as {
      userId: string;
      email: string;
      name?: string;
    };

    const data = await req.json();
    const { csdCert, csdKey, csdPassword } = data;

    if (!csdCert || !csdKey || !csdPassword) {
      return NextResponse.json(
        {
          error:
            "Faltan campos obligatorios del CSD (certificado, llave y contraseña)",
        },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { company: true },
    });

    if (!user?.company) {
      return NextResponse.json(
        { error: "Primero debe configurar los datos fiscales de la empresa" },
        { status: 400 }
      );
    }

    // Validar el CSD antes de guardar
    try {
      validateCsd(csdCert, csdKey, csdPassword, user.company.rfc);
    } catch (validationError) {
      const errorMessage =
        validationError instanceof Error
          ? validationError.message
          : "Error al validar el certificado";

      return NextResponse.json(
        { error: `Validación fallida: ${errorMessage}` },
        { status: 400 }
      );
    }

    // Guardar solo si la validación fue exitosa
    await prisma.company.update({
      where: { id: user.company.id },
      data: {
        csdCert,
        csdKey,
        csdPassword,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Certificado de Sello Digital validado y guardado correctamente",
    });
  } catch (error) {
    console.error("Error al procesar CSD:", error);
    const message =
      error instanceof Error
        ? error.message
        : "Error desconocido al procesar el certificado";
    return NextResponse.json(
      { error: `Error del servidor: ${message}` },
      { status: 500 }
    );
  }
}
