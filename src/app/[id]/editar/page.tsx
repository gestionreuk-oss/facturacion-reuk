import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { obtenerPerfilPorId } from "@/lib/perfiles";
import { haySesionAdmin } from "@/lib/session";
import { obtenerUrlBase } from "@/lib/url";
import { actualizarPerfilAction } from "../../actions";
import { PerfilForm } from "../../_components/perfil-form";
import { QrDescarga } from "../../_components/qr-descarga";

export default async function EditarPerfilPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!(await haySesionAdmin())) {
    redirect("/login");
  }

  const { id } = await params;
  const [perfil, urlBase] = await Promise.all([obtenerPerfilPorId(id), obtenerUrlBase()]);
  if (!perfil) {
    notFound();
  }

  const accion = actualizarPerfilAction.bind(null, id);
  const urlPerfil = `${urlBase}/f/${perfil.slug}`;

  return (
    <main className="min-h-screen bg-cream px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-lg">
        <Link href="/" className="text-sm text-sage-dark/70 underline underline-offset-2">
          ← Volver a perfiles
        </Link>
        <h1 className="mb-6 mt-2 font-serif text-2xl font-medium text-forest">
          Editar perfil — {perfil.nombre}
        </h1>
        <div className="rounded-2xl border border-sage-light/40 bg-white p-6 shadow-[0_20px_45px_-25px_rgba(26,65,33,0.35)]">
          <PerfilForm
            accion={accion}
            textoBoton="Guardar cambios"
            valoresIniciales={{
              nombre: perfil.nombre,
              slug: perfil.slug,
              tipoSolicitud: perfil.tipoSolicitud,
              negocioCliente: perfil.negocioCliente ?? "",
              configuracionesCalculoIds: perfil.configuracionesCalculoIds,
              activo: perfil.activo,
              usosCfdiHabilitados: perfil.usosCfdiHabilitados,
              comprobanteHabilitado: perfil.comprobanteHabilitado,
              comprobantePagoObligatorio: perfil.comprobantePagoObligatorio,
              logoUrl: perfil.logoUrl,
              correoObligatorio: perfil.correoObligatorio,
              telefonoObligatorio: perfil.telefonoObligatorio,
              qrColor: perfil.qrColor,
            }}
          />
        </div>

        <div className="mt-6">
          <QrDescarga
            url={urlPerfil}
            logoUrl={perfil.logoUrl}
            nombre={perfil.nombre}
            color={perfil.qrColor}
          />
        </div>
      </div>
    </main>
  );
}
