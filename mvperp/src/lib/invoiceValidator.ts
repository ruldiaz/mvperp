// lib/invoiceValidator.ts

export interface ValidationError {
  field: string;
  message: string;
  severity: "error" | "warning";
  code: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  canStamp: boolean; // true only if no errors
  canPreview: boolean; // true if at least basic data exists
}

interface InvoiceValidationData {
  invoice: {
    id: string;
    status: string;
    paymentMethod?: string | null;
    paymentForm?: string | null;
    cfdiUse?: string | null;
    subtotal?: number | null;
    taxes?: number | null;
  };
  company: {
    id: string;
    rfc: string;
    name: string;
    regime: string;
    postalCode: string;
    csdCert?: string | null;
    csdKey?: string | null;
    csdPassword?: string | null;
  };
  customer: {
    id: string;
    name: string;
    email?: string | null;
    rfc?: string | null;
    razonSocial?: string | null;
    taxRegime?: string | null;
    fiscalAddress?: string | null;
    fiscalPostalCode?: string | null;
    usoCFDI?: string | null;
  };
  items: Array<{
    id: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    saleItem?: {
      description?: string | null;
      product?: {
        name: string;
        sku?: string | null;
        satKey?: string | null;
        satUnitKey?: string | null;
        saleUnit?: string | null;
        iva?: number | null;
        ieps?: number | null;
      } | null;
    } | null;
  }>;
}

export class InvoiceValidator {
  private errors: ValidationError[] = [];
  private warnings: ValidationError[] = [];

  validate(data: InvoiceValidationData): ValidationResult {
    this.errors = [];
    this.warnings = [];

    // Validate invoice status
    this.validateInvoiceStatus(data.invoice);

    // Validate company (issuer) data
    this.validateCompany(data.company);

    // Validate customer (receiver) data
    this.validateCustomer(data.customer);

    // Validate invoice items
    this.validateItems(data.items);

    // Validate payment information
    this.validatePaymentInfo(data.invoice);

    // Validate tax calculations
    this.validateTaxCalculations(data.invoice, data.items);

    // Validate CFDI use compatibility
    this.validateCfdiUse(data.invoice, data.customer);

    const hasErrors = this.errors.length > 0;

    return {
      isValid: !hasErrors,
      errors: this.errors,
      warnings: this.warnings,
      canStamp: !hasErrors,
      canPreview: true, // Allow preview even with errors
    };
  }

  private validateInvoiceStatus(invoice: InvoiceValidationData["invoice"]) {
    if (invoice.status !== "pending") {
      this.errors.push({
        field: "status",
        message: `La factura no está en estado pendiente (estado actual: ${invoice.status})`,
        severity: "error",
        code: "INVALID_STATUS",
      });
    }
  }

  private validateCompany(company: InvoiceValidationData["company"]) {
    // Validate RFC
    if (!company.rfc) {
      this.errors.push({
        field: "company.rfc",
        message: "El RFC de la empresa emisora es requerido",
        severity: "error",
        code: "MISSING_ISSUER_RFC",
      });
    } else if (!this.isValidRfc(company.rfc)) {
      this.errors.push({
        field: "company.rfc",
        message: `El RFC de la empresa emisora es inválido: ${company.rfc}`,
        severity: "error",
        code: "INVALID_ISSUER_RFC",
      });
    }

    // Validate company name
    if (!company.name || company.name.trim().length === 0) {
      this.errors.push({
        field: "company.name",
        message: "El nombre de la empresa emisora es requerido",
        severity: "error",
        code: "MISSING_ISSUER_NAME",
      });
    }

    // Validate tax regime
    if (!company.regime) {
      this.errors.push({
        field: "company.regime",
        message: "El régimen fiscal de la empresa es requerido",
        severity: "error",
        code: "MISSING_ISSUER_REGIME",
      });
    } else if (!this.isValidTaxRegime(company.regime)) {
      this.warnings.push({
        field: "company.regime",
        message: `El régimen fiscal podría no ser válido: ${company.regime}`,
        severity: "warning",
        code: "SUSPICIOUS_ISSUER_REGIME",
      });
    }

    // Validate postal code
    if (!company.postalCode) {
      this.errors.push({
        field: "company.postalCode",
        message: "El código postal de la empresa es requerido (lugar de expedición)",
        severity: "error",
        code: "MISSING_EXPEDITION_PLACE",
      });
    } else if (!this.isValidMexicanZipCode(company.postalCode)) {
      this.errors.push({
        field: "company.postalCode",
        message: `El código postal de la empresa no es válido: ${company.postalCode}`,
        severity: "error",
        code: "INVALID_EXPEDITION_PLACE",
      });
    }

    // Validate CSD certificates (required for production)
    if (!company.csdCert || !company.csdKey || !company.csdPassword) {
      this.warnings.push({
        field: "company.certificates",
        message:
          "No se han configurado los certificados CSD. Solo funcionará en modo sandbox",
        severity: "warning",
        code: "MISSING_CSD_CERTIFICATES",
      });
    }
  }

  private validateCustomer(customer: InvoiceValidationData["customer"]) {
    // Validate customer name
    if (!customer.name || customer.name.trim().length === 0) {
      this.errors.push({
        field: "customer.name",
        message: "El nombre del cliente es requerido",
        severity: "error",
        code: "MISSING_RECEIVER_NAME",
      });
    }

    // Validate RFC
    const customerRfc = customer.rfc || "XAXX010101000";
    if (customerRfc !== "XAXX010101000") {
      if (!this.isValidRfc(customerRfc)) {
        this.errors.push({
          field: "customer.rfc",
          message: `El RFC del cliente es inválido: ${customerRfc}`,
          severity: "error",
          code: "INVALID_RECEIVER_RFC",
        });
      }

      // For specific customer (not generic), require more data
      if (!customer.razonSocial) {
        this.warnings.push({
          field: "customer.razonSocial",
          message: "Se recomienda especificar la razón social del cliente",
          severity: "warning",
          code: "MISSING_RAZON_SOCIAL",
        });
      }

      if (!customer.fiscalAddress) {
        this.warnings.push({
          field: "customer.fiscalAddress",
          message: "Se recomienda especificar el domicilio fiscal del cliente",
          severity: "warning",
          code: "MISSING_FISCAL_ADDRESS",
        });
      }
    }

    // Validate tax regime
    const taxRegime = customer.taxRegime || "616";
    if (!this.isValidTaxRegime(taxRegime)) {
      this.warnings.push({
        field: "customer.taxRegime",
        message: `El régimen fiscal del cliente podría no ser válido: ${taxRegime}`,
        severity: "warning",
        code: "SUSPICIOUS_RECEIVER_REGIME",
      });
    }

    // Validate postal code
    const postalCode = customer.fiscalPostalCode || "00000";
    if (customerRfc !== "XAXX010101000") {
      if (!this.isValidMexicanZipCode(postalCode)) {
        this.errors.push({
          field: "customer.fiscalPostalCode",
          message: `El código postal del cliente no es válido: ${postalCode}`,
          severity: "error",
          code: "INVALID_RECEIVER_POSTAL_CODE",
        });
      }
    }
  }

  private validateItems(items: InvoiceValidationData["items"]) {
    if (!items || items.length === 0) {
      this.errors.push({
        field: "items",
        message: "La factura debe tener al menos un concepto",
        severity: "error",
        code: "NO_ITEMS",
      });
      return;
    }

    items.forEach((item, index) => {
      // Validate quantity
      if (!item.quantity || item.quantity <= 0) {
        this.errors.push({
          field: `items[${index}].quantity`,
          message: `El concepto ${index + 1} tiene cantidad inválida`,
          severity: "error",
          code: "INVALID_ITEM_QUANTITY",
        });
      }

      // Validate unit price
      if (item.unitPrice === undefined || item.unitPrice < 0) {
        this.errors.push({
          field: `items[${index}].unitPrice`,
          message: `El concepto ${index + 1} tiene precio unitario inválido`,
          severity: "error",
          code: "INVALID_ITEM_PRICE",
        });
      }

      // Validate total price
      if (item.totalPrice === undefined || item.totalPrice < 0) {
        this.errors.push({
          field: `items[${index}].totalPrice`,
          message: `El concepto ${index + 1} tiene precio total inválido`,
          severity: "error",
          code: "INVALID_ITEM_TOTAL",
        });
      }

      // Validate description
      const description =
        item.saleItem?.description || item.saleItem?.product?.name;
      if (!description || description.trim().length === 0) {
        this.errors.push({
          field: `items[${index}].description`,
          message: `El concepto ${index + 1} no tiene descripción`,
          severity: "error",
          code: "MISSING_ITEM_DESCRIPTION",
        });
      }

      // Validate SAT keys
      const satKey = item.saleItem?.product?.satKey;
      const satUnitKey = item.saleItem?.product?.satUnitKey;

      if (!satKey) {
        this.warnings.push({
          field: `items[${index}].satKey`,
          message: `El concepto ${index + 1} no tiene clave de producto/servicio SAT`,
          severity: "warning",
          code: "MISSING_SAT_PRODUCT_KEY",
        });
      }

      if (!satUnitKey) {
        this.warnings.push({
          field: `items[${index}].satUnitKey`,
          message: `El concepto ${index + 1} no tiene clave de unidad SAT`,
          severity: "warning",
          code: "MISSING_SAT_UNIT_KEY",
        });
      }

      // Validate sale unit
      if (!item.saleItem?.product?.saleUnit) {
        this.warnings.push({
          field: `items[${index}].saleUnit`,
          message: `El concepto ${index + 1} no tiene unidad de venta especificada`,
          severity: "warning",
          code: "MISSING_SALE_UNIT",
        });
      }
    });
  }

  private validatePaymentInfo(invoice: InvoiceValidationData["invoice"]) {
    // Validate payment method
    const paymentMethod = invoice.paymentMethod || "PUE";
    if (!this.isValidPaymentMethod(paymentMethod)) {
      this.errors.push({
        field: "paymentMethod",
        message: `Método de pago inválido: ${paymentMethod}`,
        severity: "error",
        code: "INVALID_PAYMENT_METHOD",
      });
    }

    // Validate payment form
    const paymentForm = invoice.paymentForm || "01";
    if (!this.isValidPaymentForm(paymentForm)) {
      this.errors.push({
        field: "paymentForm",
        message: `Forma de pago inválida: ${paymentForm}`,
        severity: "error",
        code: "INVALID_PAYMENT_FORM",
      });
    }
  }

  private validateTaxCalculations(
    invoice: InvoiceValidationData["invoice"],
    items: InvoiceValidationData["items"]
  ) {
    // Calculate expected subtotal
    const calculatedSubtotal = items.reduce(
      (sum, item) => sum + (item.totalPrice || 0),
      0
    );

    // Calculate expected taxes (16% IVA)
    const calculatedTaxes = calculatedSubtotal * 0.16;

    // Validate subtotal
    if (invoice.subtotal !== undefined && invoice.subtotal !== null) {
      const subtotalDiff = Math.abs(invoice.subtotal - calculatedSubtotal);
      if (subtotalDiff > 0.01) {
        this.warnings.push({
          field: "subtotal",
          message: `El subtotal de la factura ($${invoice.subtotal.toFixed(2)}) no coincide con la suma de items ($${calculatedSubtotal.toFixed(2)})`,
          severity: "warning",
          code: "SUBTOTAL_MISMATCH",
        });
      }
    }

    // Validate taxes
    if (invoice.taxes !== undefined && invoice.taxes !== null) {
      const taxesDiff = Math.abs(invoice.taxes - calculatedTaxes);
      if (taxesDiff > 0.01) {
        this.warnings.push({
          field: "taxes",
          message: `Los impuestos de la factura ($${invoice.taxes.toFixed(2)}) no coinciden con el cálculo esperado ($${calculatedTaxes.toFixed(2)})`,
          severity: "warning",
          code: "TAXES_MISMATCH",
        });
      }
    }
  }

  private validateCfdiUse(
    invoice: InvoiceValidationData["invoice"],
    customer: InvoiceValidationData["customer"]
  ) {
    const cfdiUse = invoice.cfdiUse || customer.usoCFDI;

    if (!cfdiUse) {
      this.warnings.push({
        field: "cfdiUse",
        message: "No se especificó el uso del CFDI",
        severity: "warning",
        code: "MISSING_CFDI_USE",
      });
      return;
    }

    // Validate CFDI use code format
    if (!this.isValidCfdiUse(cfdiUse)) {
      this.errors.push({
        field: "cfdiUse",
        message: `Uso de CFDI inválido: ${cfdiUse}`,
        severity: "error",
        code: "INVALID_CFDI_USE",
      });
    }
  }

  // Validation helper methods
  private isValidRfc(rfc: string): boolean {
    // RFC can be:
    // - 12 characters for individuals (XXXX000000XXX)
    // - 13 characters for companies (XXX000000XXX)
    // - XAXX010101000 for generic public
    const rfcRegex = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/;
    return rfcRegex.test(rfc);
  }

  private isValidMexicanZipCode(zipCode: string): boolean {
    // Mexican zip codes are 5 digits
    const zipRegex = /^\d{5}$/;
    return zipRegex.test(zipCode);
  }

  private isValidTaxRegime(regime: string): boolean {
    // Common tax regimes in Mexico
    const validRegimes = [
      "601", // General de Ley Personas Morales
      "603", // Personas Morales con Fines no Lucrativos
      "605", // Sueldos y Salarios e Ingresos Asimilados a Salarios
      "606", // Arrendamiento
      "607", // Régimen de Enajenación o Adquisición de Bienes
      "608", // Demás ingresos
      "609", // Consolidación
      "610", // Residentes en el Extranjero sin Establecimiento Permanente en México
      "611", // Ingresos por Dividendos (socios y accionistas)
      "612", // Personas Físicas con Actividades Empresariales y Profesionales
      "614", // Ingresos por intereses
      "615", // Régimen de los ingresos por obtención de premios
      "616", // Sin obligaciones fiscales
      "620", // Sociedades Cooperativas de Producción que optan por diferir sus ingresos
      "621", // Incorporación Fiscal
      "622", // Actividades Agrícolas, Ganaderas, Silvícolas y Pesqueras
      "623", // Opcional para Grupos de Sociedades
      "624", // Coordinados
      "625", // Régimen de las Actividades Empresariales con ingresos a través de Plataformas Tecnológicas
      "626", // Régimen Simplificado de Confianza
    ];
    return validRegimes.includes(regime);
  }

  private isValidPaymentMethod(method: string): boolean {
    // SAT payment methods
    const validMethods = ["PUE", "PPD"];
    return validMethods.includes(method);
  }

  private isValidPaymentForm(form: string): boolean {
    // SAT payment forms (c_FormaPago)
    const validForms = [
      "01", // Efectivo
      "02", // Cheque nominativo
      "03", // Transferencia electrónica de fondos
      "04", // Tarjeta de crédito
      "05", // Monedero electrónico
      "06", // Dinero electrónico
      "08", // Vales de despensa
      "12", // Dación en pago
      "13", // Pago por subrogación
      "14", // Pago por consignación
      "15", // Condonación
      "17", // Compensación
      "23", // Novación
      "24", // Confusión
      "25", // Remisión de deuda
      "26", // Prescripción o caducidad
      "27", // A satisfacción del acreedor
      "28", // Tarjeta de débito
      "29", // Tarjeta de servicios
      "30", // Aplicación de anticipos
      "31", // Intermediario pagos
      "99", // Por definir
    ];
    return validForms.includes(form);
  }

  private isValidCfdiUse(use: string): boolean {
    // SAT CFDI uses (c_UsoCFDI)
    const validUses = [
      "G01", // Adquisición de mercancías
      "G02", // Devoluciones, descuentos o bonificaciones
      "G03", // Gastos en general
      "I01", // Construcciones
      "I02", // Mobilario y equipo de oficina por inversiones
      "I03", // Equipo de transporte
      "I04", // Equipo de computo y accesorios
      "I05", // Dados, troqueles, moldes, matrices y herramental
      "I06", // Comunicaciones telefónicas
      "I07", // Comunicaciones satelitales
      "I08", // Otra maquinaria y equipo
      "D01", // Honorarios médicos, dentales y gastos hospitalarios
      "D02", // Gastos médicos por incapacidad o discapacidad
      "D03", // Gastos funerales
      "D04", // Donativos
      "D05", // Intereses reales efectivamente pagados por créditos hipotecarios (casa habitación)
      "D06", // Aportaciones voluntarias al SAR
      "D07", // Primas por seguros de gastos médicos
      "D08", // Gastos de transportación escolar obligatoria
      "D09", // Depósitos en cuentas para el ahorro, primas que tengan como base planes de pensiones
      "D10", // Pagos por servicios educativos (colegiaturas)
      "S01", // Sin efectos fiscales
      "CP01", // Pagos
      "CN01", // Nómina
    ];
    return validUses.includes(use);
  }
}

export const invoiceValidator = new InvoiceValidator();
