import "server-only";

const NOTION_VERSION = "2022-06-28";

export type SolicitudFactura = {
  razonSocial: string;
  rfc: string;
  regimenFiscal: string;
  usoCfdi: string;
  codigoPostal: string;
  correo: string;
  telefono: string;
  concepto: string;
  formaPago: string;
  tipoSolicitud: string;
  negocioCliente: string;
  configuracionNombre: string;
  subtotal: number;
  iva: number;
  retencionIsr: number;
  retencionIva: number;
  totalFactura: number;
  netoAPagar: number;
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
    RFC: { rich_text: richText(data.rfc) },
    "Régimen Fiscal": { select: { name: data.regimenFiscal } },
    "Uso de CFDI": { select: { name: data.usoCfdi } },
    "Código Postal": { rich_text: richText(data.codigoPostal) },
    Correo: { email: data.correo },
    Concepto: { rich_text: richText(data.concepto) },
    Subtotal: { number: data.subtotal },
    IVA: { number: data.iva },
    "Retención ISR": { number: data.retencionIsr },
    "Retención IVA": { number: data.retencionIva },
    "Total Neto": { number: data.netoAPagar },
    "Configuración de Cálculo": { rich_text: richText(data.configuracionNombre) },
    "Forma de Pago": { select: { name: data.formaPago } },
    "Tipo de Solicitud": { select: { name: data.tipoSolicitud } },
    Estatus: { select: { name: "Recibida" } },
  };

  if (data.telefono) {
    properties["Teléfono"] = { phone_number: data.telefono };
  }
  if (data.negocioCliente) {
    properties["Negocio / Cliente (nombre)"] = {
      rich_text: richText(data.negocioCliente),
    };
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
