import "server-only";

const NOTION_VERSION = "2022-06-28";

export type SolicitudFactura = {
  razonSocial: string;
  rfc: string;
  regimenFiscal: string;
  usoCfdi: string;
  usoCfdiOtro: string;
  codigoPostal: string;
  correo: string;
  telefono: string;
  concepto: string;
  formaPago: string;
  metodoPago: string;
  clienteRecurrente: boolean;
  tipoSolicitud: string;
  negocioCliente: string;
  clienteReuk: string;
  configuracionNombre: string;
  subtotal: number;
  iva: number;
  retencionIsr: number;
  retencionIva: number;
  totalFactura: number;
  netoAPagar: number;
  comprobantePagoUrl: string;
  constanciaFiscalUrl: string;
};

type NotionRichText = { text: { content: string } }[];

function richText(value: string): NotionRichText {
  return [{ text: { content: value } }];
}

/**
 * Creates one page (row) in the "Solicitudes de Factura" Notion database.
 * Property names/options must match the database schema exactly — Notion
 * rejects a select value that isn't one of the option's existing choices.
 */
export async function crearSolicitudEnNotion(data: SolicitudFactura) {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;

  if (!token || !databaseId) {
    throw new Error(
      "Falta configurar NOTION_TOKEN o NOTION_DATABASE_ID en las variables de entorno."
    );
  }

  const properties: Record<string, unknown> = {
    "Solicitante / Razón Social": { title: richText(data.razonSocial) },
    "Uso de CFDI": { select: { name: data.usoCfdi } },
    Concepto: { rich_text: richText(data.concepto) },
    Subtotal: { number: data.subtotal },
    IVA: { number: data.iva },
    "Retención ISR": { number: data.retencionIsr },
    "Retención IVA": { number: data.retencionIva },
    "Total Neto": { number: data.netoAPagar },
    "Configuración de Cálculo": { rich_text: richText(data.configuracionNombre) },
    "Forma de Pago": { select: { name: data.formaPago } },
    "Método de Pago": { select: { name: data.metodoPago } },
    "Cliente Recurrente": { checkbox: data.clienteRecurrente },
    "Tipo de Solicitud": { select: { name: data.tipoSolicitud } },
    Estatus: { select: { name: "Recibida" } },
  };

  // Datos fiscales manuales — vacíos cuando el solicitante subió su
  // constancia en vez de escribirlos (ver "Constancia Fiscal" abajo).
  if (data.rfc) {
    properties.RFC = { rich_text: richText(data.rfc) };
  }
  if (data.regimenFiscal) {
    properties["Régimen Fiscal"] = { select: { name: data.regimenFiscal } };
  }
  if (data.codigoPostal) {
    properties["Código Postal"] = { rich_text: richText(data.codigoPostal) };
  }
  if (data.correo) {
    properties.Correo = { email: data.correo };
  }
  if (data.telefono) {
    properties["Teléfono"] = { phone_number: data.telefono };
  }
  if (data.negocioCliente) {
    properties["Negocio / Cliente (nombre)"] = {
      rich_text: richText(data.negocioCliente),
    };
  }
  if (data.comprobantePagoUrl) {
    properties["Comprobante de Pago"] = { url: data.comprobantePagoUrl };
  }
  if (data.constanciaFiscalUrl) {
    properties["Constancia Fiscal"] = { url: data.constanciaFiscalUrl };
  }
  if (data.usoCfdiOtro) {
    properties["Uso de CFDI (Otro)"] = { rich_text: richText(data.usoCfdiOtro) };
  }
  if (data.clienteReuk) {
    properties["Cliente REUK"] = { rich_text: richText(data.clienteReuk) };
  }

  const res = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": NOTION_VERSION,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Notion API respondió ${res.status}: ${body}`);
  }

  const page = (await res.json()) as {
    properties?: { Folio?: { unique_id?: { prefix: string; number: number } } };
  };
  const folio = page.properties?.Folio?.unique_id;

  return {
    folio: folio ? `${folio.prefix}-${folio.number}` : null,
  };
}
