import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Por defecto Next corta en 1MB. El formulario sube comprobantes,
      // constancias fiscales y logos como archivos — 4mb da margen para
      // fotos/PDFs típicos sin acercarse al límite duro de 4.5MB que
      // Vercel impone a las funciones serverless (ese no se puede subir
      // desde aquí; si vuelve a fallar con archivos más grandes, la
      // solución real es subir directo a Vercel Blob desde el navegador).
      bodySizeLimit: "4mb",
    },
  },
};

export default nextConfig;
