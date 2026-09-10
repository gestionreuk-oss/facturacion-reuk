import type { Metadata } from "next";
import { Montserrat, Lora } from "next/font/google";
import "./globals.css";

// Brand type system (Manual de Identidad REUK 2025): titles in Big Caslon,
// text in Montserrat. Big Caslon is a licensed print typeface with no free
// web-embeddable version, so Lora (a free serif of comparable old-style
// warmth) stands in for it here — swap in a licensed Big Caslon webfont via
// @font-face if REUK later acquires web-embedding rights.
const montserrat = Montserrat({
  variable: "--font-montserrat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin"],
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: "Solicitud de Factura — REUK",
  description: "Formulario para solicitar tu factura (CFDI) a REUK Asesoría Financiera.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${montserrat.variable} ${lora.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
