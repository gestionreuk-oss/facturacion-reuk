import { headers } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { buscarConfiguracion } from "@/lib/configuraciones";
import { listarPerfiles } from "@/lib/perfiles";
import { haySesionAdmin } from "@/lib/session";
import { cambiarActivoAction, cerrarSesionAction, eliminarPerfilAction } from "./actions";
import { CopyLinkButton } from "./_components/copy-link-button";
import { EliminarPerfilBoton } from "./_components/eliminar-perfil-boton";

async function obtenerUrlBase(): Promise<string> {
  const encabezados = await headers();
  const host = encabezados.get("host") ?? "facturacion-reuk.vercel.app";
  const proto = encabezados.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

export default async function AdminPage() {
  if (!(await haySesionAdmin())) {
    redirect("/login");
  }

  const [perfiles, urlBase] = await Promise.all([listarPerfiles(), obtenerUrlBase()]);

  return (
    <main className="min-h-screen bg-cream px-4 py-10 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-600">
              Panel REUK
            </p>
            <h1 className="mt-1 font-serif text-2xl font-medium text-forest">
              Perfiles de cliente
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/nuevo"
              className="rounded-lg bg-forest px-4 py-2 text-sm font-semibold text-cream transition hover:bg-forest/90"
            >
              + Agregar perfil
            </Link>
            <form action={cerrarSesionAction}>
              <button
                type="submit"
                className="rounded-lg border border-sage-light/60 px-4 py-2 text-sm font-medium text-sage-dark transition hover:border-forest/40 hover:text-forest"
              >
                Salir
              </button>
            </form>
          </div>
        </div>

        {perfiles.length === 0 ? (
          <div className="rounded-2xl border border-sage-light/40 bg-white p-10 text-center text-sm text-sage-dark/70">
            Todavía no hay perfiles. Crea el primero con &quot;+ Agregar perfil&quot;.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-sage-light/40 bg-white">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-sage-light/40 text-xs font-semibold uppercase tracking-wide text-sage-dark/70">
                  <th className="px-4 py-3">Perfil</th>
                  <th className="px-4 py-3">Link público</th>
                  <th className="px-4 py-3">Tipo de solicitud</th>
                  <th className="px-4 py-3">Cálculo</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {perfiles.map((perfil) => {
                  const nombresConfig = perfil.configuracionesCalculoIds
                    .map((id) => buscarConfiguracion(id)?.nombre ?? id)
                    .join(", ");
                  const urlPerfil = `${urlBase}/f/${perfil.slug}`;
                  return (
                    <tr key={perfil.id} className="border-b border-sage-light/20 last:border-0">
                      <td className="px-4 py-3">
                        <div className="font-medium text-sage-dark">{perfil.nombre}</div>
                        {perfil.negocioCliente ? (
                          <div className="text-xs text-sage-light">
                            Negocio: {perfil.negocioCliente}
                          </div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <a
                            href={urlPerfil}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Abrir el formulario en una pestaña nueva"
                            className="whitespace-nowrap rounded bg-cream px-1.5 py-0.5 text-xs text-sage-dark underline decoration-dotted underline-offset-2 transition hover:text-forest"
                          >
                            {urlPerfil}
                          </a>
                          <CopyLinkButton url={urlPerfil} />
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sage-dark/80">
                        {perfil.tipoSolicitud === "Cliente final de un cliente REUK"
                          ? "Cliente final"
                          : "Directo a REUK"}
                      </td>
                      <td className="px-4 py-3 text-sage-dark/80">{nombresConfig}</td>
                      <td className="px-4 py-3">
                        <form action={cambiarActivoAction.bind(null, perfil.id, !perfil.activo)}>
                          <button
                            type="submit"
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              perfil.activo
                                ? "bg-forest/10 text-forest"
                                : "bg-sage-light/20 text-sage-dark/60"
                            }`}
                          >
                            {perfil.activo ? "Activo" : "Inactivo"}
                          </button>
                        </form>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end gap-3 text-xs font-medium">
                          <Link
                            href={`/${perfil.id}/editar`}
                            className="text-forest underline underline-offset-2"
                          >
                            Editar
                          </Link>
                          <EliminarPerfilBoton
                            perfilId={perfil.id}
                            nombre={perfil.nombre}
                            accion={eliminarPerfilAction}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
