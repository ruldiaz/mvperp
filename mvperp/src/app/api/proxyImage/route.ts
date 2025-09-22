// src/app/api/proxyImage/route.ts
import * as cheerio from "cheerio";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const imageKey = searchParams.get("imageKey");

  if (!imageKey) {
    return Response.json(
      { message: "El parámetro 'imageKey' es requerido" },
      { status: 400 }
    );
  }

  try {
    // Realiza la solicitud a Truper con la clave de producto
    const response = await fetch(
      `https://www.truper.com/BancoContenidoDigital/index.php?r=site%2Fsearch&Productos%5Bclave%5D=${imageKey}`,
      {
        method: "GET",
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
      }
    );

    if (!response.ok) {
      return Response.json(
        { message: "Error al obtener la imagen de Truper" },
        { status: 500 }
      );
    }

    // Truper devuelve HTML, no JSON
    const html = await response.text();

    // Parsear con cheerio
    const $ = cheerio.load(html);

    // Busca la imagen del producto (selector más específico)
    const imageUrl =
      $(".product-image img").first().attr("src") ||
      $("img[src*='media/import']").first().attr("src") ||
      $("img").first().attr("src");

    if (!imageUrl) {
      return Response.json(
        { message: "Imagen no encontrada" },
        { status: 404 }
      );
    }

    // Asegurarse de que la URL sea absoluta
    const absoluteImageUrl = imageUrl.startsWith("http")
      ? imageUrl
      : `https://www.truper.com${imageUrl}`;

    return Response.json({ imageUrl: absoluteImageUrl });
  } catch (error) {
    console.error("Error al obtener la imagen", error);
    return Response.json(
      { message: "Error al realizar la solicitud" },
      { status: 500 }
    );
  }
}
