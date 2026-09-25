import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Por defecto Next corta en 1MB. El formulario sube comprobantes,
      // constancias fiscales y logos como archivos — 4.2mb es lo más alto
      // que se puede subir con margen de seguridad razonable sin acercarse
      // demasiado al límite duro de 4.5MB que Vercel impone al cuerpo
      // completo de la petición en sus funciones serverless (ese límite no
      // se puede subir desde aquí). Si vuelve a fallar con archivos más
      // grandes, la solución real es subir directo a Vercel Blob desde el
      // navegador, sin pasar por ese techo.
      bodySizeLimit: "4.2mb",
    },
  },
};

export default nextConfig;
