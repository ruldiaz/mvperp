// lib/facturama.ts
export interface FacturamaItem {
  Quantity: number;
  ProductCode: string;
  UnitCode: string;
  Unit: string;
  Description: string;
  IdentificationNumber?: string;
  UnitPrice: number;
  Subtotal: number;
  TaxObject: string;
  Taxes: Array<{
    Name: string;
    Rate: number;
    Total: number;
    Base: number;
    IsRetention: boolean;
    IsFederalTax: boolean;
  }>;
  Total: number;
}

// Agrega esta interfaz cerca de las otras interfaces de Facturama
export interface GlobalInformation {
  Periodicity: string;
  Months: string;
  Year: string;
}

export interface FacturamaRequest {
  Receiver: {
    Name: string;
    CfdiUse: string;
    Rfc: string;
    FiscalRegime: string;
    TaxZipCode: string;
  };
  GlobalInformation?: GlobalInformation; // 👈 Agregar esta línea
  CfdiType: string;
  NameId: string;
  ExpeditionPlace: string;
  Serie?: string | null;
  Folio?: string | null;
  PaymentForm: string;
  PaymentMethod: string;
  Exportation: string;
  Items: FacturamaItem[];
}

export interface FacturamaResponse {
  Id: string;
  CfdiType: string;
  Type: string;
  Serie: string;
  Folio: string;
  Date: string;
  CertNumber: string;
  PaymentMethod: string;
  ExpeditionPlace: string;
  Subtotal: number;
  Total: number;
  Receiver: {
    Rfc: string;
    Name: string;
  };
  Complement: {
    TaxStamp: {
      Uuid: string;
      Date: string;
      CfdiSign: string;
    };
  };
  Status: string;
  CfdiSign?: string;
}

export interface FacturamaPdfResponse {
  ContentEncoding: string;
  ContentType: string;
  ContentLength: number;
  Content: string;
}

export interface FacturamaCancelResponse {
  Status: string;
  Message?: string;
}

class FacturamaService {
  private baseUrl: string;
  private credentials: string;

  // lib/facturama.ts (parte del constructor)
  constructor(testMode: boolean = true) {
    this.baseUrl = testMode
      ? "https://apisandbox.facturama.mx"
      : "https://api.facturama.mx";

    // 👇 Usar variables de entorno en lugar de hardcode
    const username = process.env.FACTURAMA_USERNAME || "tu_usuario_real";
    const password = process.env.FACTURAMA_PASSWORD || "tu_password_real";

    this.credentials = Buffer.from(`${username}:${password}`).toString(
      "base64"
    );
  }

  async createCfdi(invoiceData: FacturamaRequest): Promise<FacturamaResponse> {
    const response = await fetch(`${this.baseUrl}/3/cfdis`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${this.credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoiceData),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error creating CFDI: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async getPdf(cfdiId: string): Promise<FacturamaPdfResponse> {
    try {
      const url = `${this.baseUrl}/cfdi/pdf/issued/${cfdiId}`;
      console.log(`Solicitando PDF desde: ${url}`);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Basic ${this.credentials}`,
        },
      });

      console.log(
        `Respuesta PDF - Status: ${response.status}, OK: ${response.ok}`
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error detallado del PDF: ${errorText}`);

        // Verificar si es un error de autenticación
        if (response.status === 401) {
          throw new Error(
            `Error de autenticación con Facturama. Verifica tus credenciales.`
          );
        }

        // Verificar si es un error de no encontrado
        if (response.status === 404) {
          throw new Error(
            `PDF no disponible. El CFDI fue timbrado pero el PDF aún no está listo. ID: ${cfdiId}`
          );
        }

        throw new Error(`Error getting PDF: ${response.status} - ${errorText}`);
      }

      const pdfData = await response.json();
      console.log(
        `PDF obtenido exitosamente. Tamaño: ${pdfData.ContentLength} bytes`
      );

      return pdfData;
    } catch (error) {
      console.error(
        `Error completo obteniendo PDF para CFDI ${cfdiId}:`,
        error
      );
      throw error;
    }
  }

  async cancelCfdi(
    cfdiId: string,
    motivo: string,
    folioSustituto?: string
  ): Promise<FacturamaCancelResponse> {
    const response = await fetch(`${this.baseUrl}/3/cfdis/${cfdiId}`, {
      method: "DELETE",
      headers: {
        Authorization: `Basic ${this.credentials}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        Motivo: motivo,
        FolioSustituto: folioSustituto || null,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error canceling CFDI: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  }

  // Método adicional para obtener el XML
  async getXml(cfdiId: string): Promise<string> {
    const response = await fetch(`${this.baseUrl}/cfdi/xml/issued/${cfdiId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${this.credentials}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Error getting XML: ${response.status} - ${errorText}`);
    }

    return response.text();
  }

  // Método para verificar el estado de un CFDI
  async getCfdiStatus(cfdiId: string): Promise<{ Status: string }> {
    const response = await fetch(`${this.baseUrl}/3/cfdis/${cfdiId}`, {
      method: "GET",
      headers: {
        Authorization: `Basic ${this.credentials}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Error getting CFDI status: ${response.status} - ${errorText}`
      );
    }

    return response.json();
  }
}

export const facturamaService = new FacturamaService();
