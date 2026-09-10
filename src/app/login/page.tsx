import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-cream px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-6 text-center font-serif text-2xl font-medium text-forest">
          Panel REUK
        </h1>
        <div className="rounded-2xl border border-sage-light/40 bg-white p-6 shadow-[0_20px_45px_-25px_rgba(26,65,33,0.35)]">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
