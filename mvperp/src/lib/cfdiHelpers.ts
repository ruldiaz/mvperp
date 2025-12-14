// lib/cfdiHelpers.ts
export function getDefaultCfdiUse(fiscalRegime?: string): string {
  switch (fiscalRegime) {
    case "616": // Sin obligaciones fiscales
      return "S01"; // Sin efectos fiscales
    case "626": // Régimen Simplificado de Confianza
      return "G03"; // Gastos en general
    default:
      return "G03"; // Gastos en general (default)
  }
}

export function validateExpeditionPlaceForRfc(
  rfc: string,
  expeditionPlace: string,
  taxZipCode: string
): string {
  if (rfc === "XAXX010101000" || rfc === "XEXX010101000") {
    return taxZipCode || expeditionPlace;
  }
  return expeditionPlace;
}

export function isValidRfc(rfc: string): boolean {
  if (!rfc) return false;

  const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-V1-9][A-Z1-9][0-9A]$/;
  return rfcRegex.test(rfc.toUpperCase());
}

// Mapeo de usos de CFDI
export const CFDI_USES = {
  G01: "Adquisición de mercancías",
  G02: "Devoluciones, descuentos o bonificaciones",
  G03: "Gastos en general",
  G04: "Construcciones",
  I01: "Construcciones",
  I02: "Mobiliario y equipo de oficina por inversiones",
  I03: "Equipo de transporte",
  I04: "Equipo de cómputo y accesorios",
  I05: "Dados, troqueles, moldes, matrices y herramental",
  I06: "Comunicaciones telefónicas",
  I07: "Comunicaciones satelitales",
  I08: "Otra maquinaria y equipo",
  D01: "Honorarios médicos, dentales y gastos hospitalarios",
  D02: "Gastos médicos por incapacidad o discapacidad",
  D03: "Gastos funerales",
  D04: "Donativos",
  D05: "Intereses reales efectivamente pagados por créditos hipotecarios",
  D06: "Aportaciones voluntarias al SAR",
  D07: "Primas por seguros de gastos médicos",
  D08: "Gastos de transportación escolar obligatoria",
  D09: "Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones",
  D10: "Pagos por servicios educativos (colegiaturas)",
  S01: "Sin efectos fiscales",
  CP01: "Pagos",
  CN01: "Nómina",
  P01: "Por definir",
} as const;

export type CfdiUse = keyof typeof CFDI_USES;

// Mapeo de métodos de pago
export const PAYMENT_METHODS = {
  PUE: "Pago en una sola exhibición",
  PPD: "Pago en parcialidades o diferido",
} as const;

export type PaymentMethod = keyof typeof PAYMENT_METHODS;

// Mapeo de formas de pago
export const PAYMENT_FORMS = {
  "01": "Efectivo",
  "02": "Cheque nominativo",
  "03": "Transferencia electrónica de fondos",
  "04": "Tarjeta de crédito",
  "05": "Monedero electrónico",
  "06": "Dinero electrónico",
  "08": "Vales de despensa",
  "12": "Dación en pago",
  "13": "Pago por subrogación",
  "14": "Pago por consignación",
  "15": "Condonación",
  "17": "Compensación",
  "23": "Novación",
  "24": "Confusión",
  "25": "Remisión de deuda",
  "26": "Prescripción o caducidad",
  "27": "A satisfacción del acreedor",
  "28": "Tarjeta de débito",
  "29": "Tarjeta de servicios",
  "30": "Aplicación de anticipos",
  "31": "Intermediario pagos",
  "99": "Por definir",
} as const;

export type PaymentForm = keyof typeof PAYMENT_FORMS;

// Mapeo de regímenes fiscales
export const FISCAL_REGIMES = {
  "601": "General de Ley Personas Morales",
  "603": "Personas Morales con Fines no Lucrativos",
  "605": "Sueldos y Salarios",
  "606": "Arrendamiento",
  "607": "Régimen de Enajenación o Adquisición de Bienes",
  "608": "Demás ingresos",
  "610": "Residentes en el Extranjero sin Establecimiento Permanente en México",
  "611": "Ingresos por Dividendos (socios y accionistas)",
  "612": "Personas Físicas con Actividades Empresariales y Profesionales",
  "614": "Ingresos por intereses",
  "616": "Sin obligaciones fiscales",
  "620":
    "Sociedades Cooperativas de Producción que optan por diferir sus ingresos",
  "621": "Incorporación Fiscal",
  "622": "Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras",
  "623": "Opcional para Grupos de Sociedades",
  "624": "Coordinados",
  "625":
    "Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas",
  "626": "Régimen Simplificado de Confianza",
} as const;

export type FiscalRegime = keyof typeof FISCAL_REGIMES;

// Mapeo de claves de producto/servicio SAT (ejemplos comunes)
export const SAT_PRODUCT_KEYS = {
  "01010101": "No existe en el catálogo",
  "50171700": "Servicios de facturación",
  "50211506": "Servicios de cómputo",
  "50201713": "Servicios de desarrollo de software",
  "43201800": "Equipo de cómputo",
  "44121600": "Papelería y artículos de oficina",
  "60121100": "Servicios de consultoría",
  "72101500": "Servicios de limpieza",
  "81101500": "Servicios de publicidad",
  "82101500": "Servicios de impresión",
} as const;

// Mapeo de claves de unidad SAT
export const SAT_UNIT_KEYS = {
  H87: "Pieza",
  ACT: "Actividad",
  E48: "Unidad de servicio",
  EA: "Elemento",
  HR: "Hora",
  DAY: "Día",
  MTR: "Metro",
  KGM: "Kilogramo",
  LTR: "Litro",
  MTK: "Metro cuadrado",
  MTQ: "Metro cúbico",
} as const;

export type SatUnitKey = keyof typeof SAT_UNIT_KEYS;

// Función para validar que el uso CFDI sea compatible con el régimen fiscal
export function validateCfdiUseForRegime(
  cfdiUse: string,
  fiscalRegime?: string
): boolean {
  if (!fiscalRegime) return true;

  // Régimen 616 (Sin obligaciones fiscales) solo permite S01
  if (fiscalRegime === "616") {
    return cfdiUse === "S01";
  }

  // Otros regímenes no pueden usar S01
  if (cfdiUse === "S01" && fiscalRegime !== "616") {
    return false;
  }

  return true;
}

// Función para obtener el uso CFDI recomendado basado en el régimen fiscal
export function getRecommendedCfdiUse(fiscalRegime?: string): string {
  switch (fiscalRegime) {
    case "616": // Sin obligaciones fiscales
      return "S01"; // Sin efectos fiscales
    case "605": // Sueldos y Salarios
    case "606": // Arrendamiento
      return "G03"; // Gastos en general
    case "601": // General de Ley Personas Morales
    case "603": // Personas Morales con Fines no Lucrativos
    default:
      return "G03"; // Gastos en general
  }
}

// Función para formatear montos para CFDI
export function formatAmount(amount: number): string {
  return amount.toFixed(2);
}

// Función para calcular impuestos
export function calculateTaxes(
  subtotal: number,
  taxRate: number = 0.16
): {
  tax: number;
  total: number;
} {
  const tax = subtotal * taxRate;
  const total = subtotal + tax;

  return {
    tax: parseFloat(tax.toFixed(2)),
    total: parseFloat(total.toFixed(2)),
  };
}

// Función para validar código postal mexicano
export function isValidMexicanZipCode(zipCode: string): boolean {
  if (!zipCode) return false;
  const zipRegex = /^\d{5}$/;
  return zipRegex.test(zipCode);
}

// Función para obtener la descripción de un uso CFDI
export function getCfdiUseDescription(cfdiUse: string): string {
  return CFDI_USES[cfdiUse as CfdiUse] || "Uso CFDI no reconocido";
}

// Función para obtener la descripción de una forma de pago
export function getPaymentFormDescription(paymentForm: string): string {
  return (
    PAYMENT_FORMS[paymentForm as PaymentForm] || "Forma de pago no reconocida"
  );
}

// Función para obtener la descripción de un régimen fiscal
export function getFiscalRegimeDescription(fiscalRegime: string): string {
  return (
    FISCAL_REGIMES[fiscalRegime as FiscalRegime] ||
    "Régimen fiscal no reconocido"
  );
}

// Función para validar objeto de impuesto
export function validateTaxObject(taxObject: string): boolean {
  const validObjects = ["01", "02", "03"];
  return validObjects.includes(taxObject);
}

const cfdiHelpers = {
  getDefaultCfdiUse,
  validateExpeditionPlaceForRfc,
  isValidRfc,
  CFDI_USES,
  PAYMENT_METHODS,
  PAYMENT_FORMS,
  FISCAL_REGIMES,
  SAT_PRODUCT_KEYS,
  SAT_UNIT_KEYS,
  validateCfdiUseForRegime,
  getRecommendedCfdiUse,
  formatAmount,
  calculateTaxes,
  isValidMexicanZipCode,
  getCfdiUseDescription,
  getPaymentFormDescription,
  getFiscalRegimeDescription,
  validateTaxObject,
};

export default cfdiHelpers;
