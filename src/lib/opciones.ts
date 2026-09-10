/**
 * These option lists must mirror the select options already created on the
 * "Solicitudes de Factura" Notion database exactly (spelling, punctuation).
 * The Notion API rejects a select value that doesn't match an existing
 * option name. Add new options in Notion first, then add them here.
 */

export const REGIMENES_FISCALES = [
  "612 - Persona física con actividad empresarial",
  "601 - General de Ley Personas Morales",
  "626 - RESICO",
  "605 - Sueldos y salarios",
  "616 - Sin obligaciones fiscales",
  "Otro",
] as const;

/**
 * Catálogo completo de Uso de CFDI del SAT. Cada perfil de cliente puede
 * restringir cuáles de estos aparecen en su formulario (ver
 * `usosCfdiHabilitados` en `src/lib/perfiles.ts`) — "Otro" siempre está
 * disponible, sin importar la restricción, con escritura libre.
 */
export const USOS_CFDI = [
  "G01 - Adquisición de mercancías",
  "G02 - Devoluciones descuentos o bonificaciones",
  "G03 - Gastos en general",
  "I01 - Construcciones",
  "I02 - Mobiliario y equipo de oficina por inversiones",
  "I03 - Equipo de transporte",
  "I04 - Equipo de cómputo y accesorios",
  "I05 - Dados troqueles moldes matrices y otros activos",
  "I06 - Comunicaciones telefónicas",
  "I07 - Comunicaciones satelitales",
  "I08 - Otra maquinaria y equipo",
  "D01 - Honorarios médicos dentales y gastos hospitalarios",
  "D02 - Gastos médicos por incapacidad o discapacidad",
  "D03 - Gastos funerales",
  "D04 - Donativos",
  "D05 - Intereses reales por créditos hipotecarios (casa habitación)",
  "D06 - Aportaciones voluntarias al SAR",
  "D07 - Primas por seguros de gastos médicos",
  "D08 - Gastos de transportación escolar obligatoria",
  "D09 - Depósitos en cuentas para el ahorro y pensiones",
  "D10 - Pagos por servicios educativos (colegiaturas)",
  "S01 - Sin efectos fiscales",
  "CP01 - Pagos",
  "CN01 - Nómina",
  "P01 - Por definir",
  "Otro",
] as const;

export const FORMAS_PAGO = [
  "01 - Efectivo",
  "03 - Transferencia electrónica",
  "04 - Tarjeta de crédito",
  "28 - Tarjeta de débito",
  "99 - Por definir",
  "Otro",
] as const;

/** Forma de pago que se puede elegir cuando el método de pago es PUE. */
export const FORMAS_PAGO_PUE = FORMAS_PAGO.filter((f) => f !== "99 - Por definir");

/** Única forma de pago válida cuando el método de pago es PPD. */
export const FORMA_PAGO_PPD = "99 - Por definir";

export const METODOS_PAGO = [
  "PUE - Pago en una sola exhibición",
  "PPD - Pago en parcialidades o diferido",
] as const;

export const TIPOS_SOLICITUD = [
  "Cliente final de un cliente REUK",
  "Cliente directo de REUK",
] as const;
