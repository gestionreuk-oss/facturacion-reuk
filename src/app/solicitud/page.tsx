import Image from "next/image";
import { SolicitudForm } from "@/app/_components/solicitud-form";

export default function Home() {
  return (
    <main className="flex min-h-screen items-start justify-center bg-cream px-4 py-12 sm:py-16">
      <div className="w-full max-w-xl">
        <header className="mb-10 flex flex-col items-center text-center">
          <Image
            src="/reuk-horizontal-dark.png"
            alt="REUK Asesoría Financiera"
            width={967}
            height={380}
            priority
            className="h-12 w-auto"
          />
          <h1 className="mt-7 font-serif text-3xl font-medium text-forest sm:text-4xl">
            Solicitud de factura
          </h1>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-sage-dark/80">
            Llena los datos fiscales y te la haremos llegar por correo. Usa
            este mismo formulario si le compraste a un negocio asesorado por
            nosotros, o si nos solicitas la factura directo a REUK.
          </p>
        </header>

        <div className="rounded-2xl border border-sage-light/40 bg-white p-6 shadow-[0_20px_45px_-25px_rgba(26,65,33,0.35)] sm:p-8">
          <SolicitudForm />
        </div>

        <p className="mt-6 text-center text-xs text-sage-light">
          {/* TODO: pon aquí el correo o WhatsApp de contacto que quieras mostrar públicamente */}
          ¿Dudas con tu solicitud? Escríbenos a{" "}
          <a
            href="mailto:contacto@reuk.com.mx"
            className="text-sage-dark underline underline-offset-2"
          >
            contacto@reuk.com.mx
          </a>
        </p>
      </div>
    </main>
  );
}
