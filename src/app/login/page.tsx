import Image from "next/image";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center text-center">
          <Image
            src="/reuk-horizontal-dark.png"
            alt="REUK Asesoría Financiera"
            width={967}
            height={380}
            priority
            className="h-10 w-auto"
          />
          <h1 className="mt-4 font-serif text-2xl font-medium text-forest">
            Panel de facturación REUK
          </h1>
        </div>
        <div className="rounded-2xl border border-sage-light/40 bg-white p-6 shadow-[0_20px_45px_-25px_rgba(26,65,33,0.35)]">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
