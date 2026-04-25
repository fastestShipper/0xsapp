"use client";
import { useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase-browser";
import { Sparkles, Mail, ArrowRight, Loader2, Check } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  const isConfigured = !!process.env.NEXT_PUBLIC_SUPABASE_URL;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isConfigured) {
      window.location.href = "/";
      return;
    }
    setState("loading");
    setError("");
    const sb = getBrowserSupabase();
    const { error } = await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) { setState("error"); setError(error.message); return; }
    setState("sent");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 bg-gradient-to-br from-background via-background to-accent/30">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <div className="inline-flex h-14 w-14 rounded-2xl rotate-45 bg-gradient-to-br from-sky-400 via-blue-500 to-blue-700 items-center justify-center shadow-lg shadow-blue-500/30 mb-5">
            <span className="-rotate-45 text-white font-black text-lg tracking-tighter">cA</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mb-2">Bienvenido a Control A</h1>
          <p className="text-[14px] text-muted-foreground">Tu equipo de IA en una sola app.</p>
        </div>

        <form onSubmit={submit} className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
          <div className="space-y-1.5">
            <label className="text-[12px] font-medium text-muted-foreground">Email</label>
            <div className="relative">
              <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="tu@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 h-10 rounded-lg border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-[14px] transition-all"
              />
            </div>
          </div>

          {state === "sent" ? (
            <div className="flex items-center gap-2 text-[13px] text-primary px-3 py-2 rounded-lg bg-primary/10">
              <Check size={14} /> Te enviamos el link a tu correo.
            </div>
          ) : (
            <button
              type="submit"
              disabled={state === "loading" || !email}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-[14px] hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {state === "loading" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <>{isConfigured ? "Enviar link de acceso" : "Entrar al demo"} <ArrowRight size={14} /></>
              )}
            </button>
          )}

          {error && <div className="text-[12px] text-red-500">{error}</div>}

          {!isConfigured && (
            <div className="text-[11.5px] text-muted-foreground border-t pt-3 mt-2 flex items-start gap-2">
              <Sparkles size={11} className="mt-0.5 shrink-0 text-primary" />
              <span>Modo demo — Supabase no configurado. Hace click para entrar al workspace con datos de ejemplo.</span>
            </div>
          )}
        </form>

        <p className="mt-6 text-center text-[11.5px] text-muted-foreground">
          Al continuar aceptas los terminos de uso y la politica de privacidad.
        </p>
      </div>
    </div>
  );
}
