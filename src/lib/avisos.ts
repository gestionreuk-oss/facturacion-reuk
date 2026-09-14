import "server-only";

/**
 * Aviso push de "nueva solicitud" vía ntfy (https://ntfy.sh): al publicar en
 * un tema, todo dispositivo suscrito (app en el celular, navegador en la PC)
 * recibe la notificación al instante — sin que nadie tenga abierto nada.
 *
 * Reglas:
 *  - NUNCA rompe ni retrasa el envío del cliente: se llama después de que la
 *    solicitud ya quedó en Notion, y si ntfy falla solo se registra el error.
 *  - El mensaje es DISCRETO a propósito: folio y tipo, sin nombre ni monto.
 *    ntfy.sh cifra en tránsito pero no de extremo a extremo; los datos del
 *    solicitante se ven ya dentro del Comando, no en el push.
 *  - Sin NTFY_TOPIC configurado, no hace nada (el portal funciona igual).
 *
 * Variables de entorno:
 *   NTFY_TOPIC   Nombre del tema. Debe ser difícil de adivinar (quien conozca
 *                el nombre puede leerlo): p. ej. "reuk-fact-k7x2mq9p".
 *   NTFY_URL     (opcional) servidor ntfy. Por defecto https://ntfy.sh.
 *   NTFY_TOKEN   (opcional) token de acceso si el tema está protegido.
 *   COMANDO_URL  (opcional) a dónde lleva el botón "Abrir Comando".
 *                Por defecto https://comando-reuk.vercel.app.
 */

export type AvisoSolicitud = {
  folio: string | null;
  tipoSolicitud: string;
  clienteReuk: string;
};

export async function avisarNuevaSolicitud(aviso: AvisoSolicitud): Promise<void> {
  const topic = process.env.NTFY_TOPIC?.trim();
  if (!topic) return;

  const base = (process.env.NTFY_URL?.trim() || "https://ntfy.sh").replace(/\/+$/, "");
  const comando = process.env.COMANDO_URL?.trim() || "https://comando-reuk.vercel.app";

  const origen =
    aviso.tipoSolicitud === "Cliente directo de REUK"
      ? "Directo de REUK"
      : aviso.clienteReuk || "Cliente de un cliente REUK";
  const cuerpo = `${aviso.folio ?? "Sin folio"} · ${origen}`;

  const headers: Record<string, string> = {
    // ntfy exige encabezados ASCII: los acentos van en el cuerpo, no aquí.
    Title: "Nueva solicitud de factura",
    Priority: "high",
    Tags: "receipt",
    Click: comando,
    Actions: `view, Abrir Comando, ${comando}`,
  };
  const token = process.env.NTFY_TOKEN?.trim();
  if (token) headers.Authorization = `Bearer ${token}`;

  try {
    const res = await fetch(`${base}/${encodeURIComponent(topic)}`, {
      method: "POST",
      headers,
      body: cuerpo,
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error(`ntfy respondió ${res.status}: ${(await res.text()).slice(0, 200)}`);
    }
  } catch (error) {
    // La solicitud ya está en Notion; el aviso es un extra, no un requisito.
    console.error("No se pudo enviar el aviso ntfy:", error);
  }
}
