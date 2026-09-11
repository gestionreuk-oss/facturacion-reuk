"use client";

import QRCode from "qrcode";

function cargarImagen(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`No se pudo cargar la imagen: ${src}`));
    img.src = src;
  });
}

function trazarRectanguloRedondeado(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  ancho: number,
  alto: number,
  radio: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radio, y);
  ctx.arcTo(x + ancho, y, x + ancho, y + alto, radio);
  ctx.arcTo(x + ancho, y + alto, x, y + alto, radio);
  ctx.arcTo(x, y + alto, x, y, radio);
  ctx.arcTo(x, y, x + ancho, y, radio);
  ctx.closePath();
}

/**
 * Genera un código QR (PNG, como data URL) que apunta a `url`. Si se da
 * `logoUrl`, lo dibuja al centro sobre un fondo blanco redondeado — el nivel
 * de corrección de errores "H" deja margen para que el logo no rompa la
 * lectura del código.
 */
export async function generarQrDataUrl(
  url: string,
  logoUrl?: string | null
): Promise<string> {
  const tamaño = 640;
  const canvas = document.createElement("canvas");

  await QRCode.toCanvas(canvas, url, {
    width: tamaño,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#1A4121", light: "#F8F8F2" },
  });

  if (logoUrl) {
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const logo = await cargarImagen(logoUrl);
      const logoTamaño = tamaño * 0.2;
      const x = (tamaño - logoTamaño) / 2;
      const y = (tamaño - logoTamaño) / 2;
      const relleno = logoTamaño * 0.18;

      ctx.fillStyle = "#F8F8F2";
      trazarRectanguloRedondeado(
        ctx,
        x - relleno,
        y - relleno,
        logoTamaño + relleno * 2,
        logoTamaño + relleno * 2,
        12
      );
      ctx.fill();

      ctx.save();
      trazarRectanguloRedondeado(ctx, x, y, logoTamaño, logoTamaño, 8);
      ctx.clip();
      ctx.drawImage(logo, x, y, logoTamaño, logoTamaño);
      ctx.restore();
    }
  }

  return canvas.toDataURL("image/png");
}

export function nombreArchivoQr(nombre: string): string {
  const seguro = nombre
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return `qr-${seguro || "cliente"}.png`;
}
