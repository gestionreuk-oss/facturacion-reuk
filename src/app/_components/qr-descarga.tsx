"use client";

import { useEffect, useState } from "react";
import { generarQrDataUrl, nombreArchivoQr } from "./qr-utils";

export function QrDescarga({
  url,
  logoUrl,
  nombre,
  color,
}: {
  url: string;
  logoUrl: string | null;
  nombre: string;
  color: string;
}) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelado = false;
    generarQrDataUrl(url, logoUrl, color)
      .then((resultado) => {
        if (!cancelado) setDataUrl(resultado);
      })
      .catch(() => {
        if (!cancelado) setError("No se pudo generar el código QR.");
      });
    return () => {
      cancelado = true;
    };
  }, [url, logoUrl, color]);

  return (
    <div className="rounded-2xl border border-sage-light/40 bg-white p-6 shadow-[0_20px_45px_-25px_rgba(26,65,33,0.35)]">
      <h2 className="font-serif text-lg font-medium text-forest">Código QR</h2>
      <p className="mt-1 text-xs text-sage-dark/60">
        Apunta al link público de este perfil. Compártelo o imprímelo para que tus clientes
        soliciten su factura escaneándolo. Para cambiar el color, edita &quot;Color del código
        QR&quot; arriba y guarda cambios.
      </p>
      <div className="mt-4 flex flex-col items-center gap-4">
        {error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : dataUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={dataUrl}
              alt={`Código QR de ${nombre}`}
              className="h-52 w-52 rounded-lg border border-sage-light/40"
            />
            <a
              href={dataUrl}
              download={nombreArchivoQr(nombre)}
              className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-cream transition hover:bg-forest/90"
            >
              Descargar QR
            </a>
          </>
        ) : (
          <p className="text-sm text-sage-dark/60">Generando…</p>
        )}
      </div>
    </div>
  );
}
