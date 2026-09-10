import "server-only";
import { put } from "@vercel/blob";

/**
 * Sube un archivo (comprobante de pago, constancia fiscal) a Vercel Blob y
 * regresa su URL pública. `prefijo` solo organiza las carpetas dentro del
 * store (ej. "comprobantes", "constancias").
 */
export async function subirArchivo(file: File, prefijo: string): Promise<string> {
  const nombreSeguro = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const ruta = `${prefijo}/${Date.now()}-${nombreSeguro}`;
  const resultado = await put(ruta, file, {
    access: "public",
    addRandomSuffix: true,
  });
  return resultado.url;
}

/** Un input de archivo vacío en un <form> llega como File con size 0. */
export function esArchivoValido(valor: FormDataEntryValue | null): valor is File {
  return valor instanceof File && valor.size > 0;
}
