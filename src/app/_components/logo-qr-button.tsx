"use client";

import { useState } from "react";
import { generarQrDataUrl, nombreArchivoQr } from "./qr-utils";

export function LogoQrButton({
  logoUrl,
  url,
  nombre,
}: {
  logoUrl: string;
  url: string;
  nombre: string;
}) {
  const [cargando, setCargando] = useState(false);

  async function descargarQr() {
    setCargando(true);
    try {
      const dataUrl = await generarQrDataUrl(url, logoUrl);
      const enlace = document.createElement("a");
      enlace.href = dataUrl;
      enlace.download = nombreArchivoQr(nombre);
      enlace.click();
    } catch {
      alert("No se pudo generar el código QR. Intenta desde \"Editar\".");
    } finally {
      setCargando(false);
    }
  }

  return (
    <button
      type="button"
      onClick={descargarQr}
      disabled={cargando}
      title="Descargar código QR"
      className="shrink-0 disabled:opacity-50"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoUrl}
        alt=""
        className="h-9 w-9 rounded-full border border-sage-light/40 object-cover transition hover:opacity-80"
      />
    </button>
  );
}
