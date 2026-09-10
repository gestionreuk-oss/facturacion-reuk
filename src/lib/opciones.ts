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

export const USOS_CFDI = [
  "G03 - Gastos en general",
  "G01 - Adquisición de mercancías",
  "P01 - Por definir",
  "I01 - Construcciones",
  "D01 - Honorarios médicos",
  "Otro",
] as const;

export const FORMAS_PAGO = [
  "01 - Efectivo",
  "03 - Transferencia electrónica",
  "04 - Tarjeta de crédito",
  "28 - Tarjeta de débito",
  "Otro",
] as const;

export const TIPOS_SOLICITUD = [
  "Cliente final de un cliente REUK",
  "Cliente directo de REUK",
] as const;
