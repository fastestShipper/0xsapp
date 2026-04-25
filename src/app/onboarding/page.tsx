"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ONBOARDING_STEPS, buildRoster, type RecommendedAgent } from "@/lib/onboarding";
import { Avatar } from "@/components/avatar";
import { ArrowRight, Sparkles, Check } from "lucide-react";
import { cn } from "@/lib/cn";

type Answer = { step: string; value: string | string[] };

export default function OnboardingPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [registered, setRegistered] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [multiSel, setMultiSel] = useState<string[]>([]);
  const [freeText, setFreeText] = useState("");
  const [done, setDone] = useState(false);
  const [roster, setRoster] = useState<RecommendedAgent[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [stepIdx, registered, done]);

  const submitRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    localStorage.setItem("controla:user_name", name.trim());
    setRegistered(true);
  };

  const answer = (value: string | string[]) => {
    const step = ONBOARDING_STEPS[stepIdx];
    const next = [...answers, { step: step.id, value }];
    setAnswers(next);
    setMultiSel([]);
    setFreeText("");
    if (stepIdx < ONBOARDING_STEPS.length - 1) {
      setStepIdx(stepIdx + 1);
    } else {
      const needs = (next.find((a) => a.step === "needs")?.value ?? []) as string[];
      const r = buildRoster(needs);
      setRoster(r);
      localStorage.setItem("controla:onboarding", JSON.stringify(next));
      localStorage.setItem("controla:roster", JSON.stringify(r.map((a) => a.id)));
      setDone(true);
    }
  };

  const enterWorkspace = () => {
    localStorage.setItem("controla:onboarded", "true");
    router.push("/");
  };

  if (!registered) {
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
          <form onSubmit={submitRegister} className="bg-card border rounded-2xl p-6 shadow-sm space-y-4">
            <div className="space-y-1.5">
              <label className="text-[12px] font-medium text-muted-foreground">¿Cómo te llamas?</label>
              <input
                autoFocus
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 h-10 rounded-lg border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-[14px] transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!name.trim()}
              className="w-full h-10 rounded-lg bg-primary text-primary-foreground font-medium text-[14px] hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              Empezar <ArrowRight size={14} />
            </button>
            <p className="text-[11px] text-muted-foreground text-center pt-1">Sin tarjeta. Sin tutorial. Solo conversación con Piter.</p>
          </form>
        </div>
      </div>
    );
  }

  const step = ONBOARDING_STEPS[stepIdx];

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-background via-background to-accent/20">
      <header className="px-6 py-4 border-b bg-card/50 backdrop-blur flex items-center gap-3">
        <Avatar name="Piter" accent="bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600" online size={36} />
        <div>
          <div className="font-semibold text-[14px]">Piter</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse-dot" /> En línea
          </div>
        </div>
      </header>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-[640px] mx-auto space-y-6">
          {answers.map((a, i) => {
            const s = ONBOARDING_STEPS.find((x) => x.id === a.step)!;
            const labels = Array.isArray(a.value)
              ? a.value.map((v) => s.options?.find((o) => o.id === v)?.label ?? v).join(" · ")
              : (s.options?.find((o) => o.id === a.value)?.label ?? String(a.value));
            return (
              <AgentTurn key={`q-${i}`} text={s.question} delay={0} answered>
                <UserBubble text={labels} />
              </AgentTurn>
            );
          })}

          {!done && (
            <AgentTurn key={`step-${stepIdx}`} text={step.question} delay={0.1}>
              {step.options && !step.multi && (
                <div className="grid grid-cols-2 gap-2 max-w-[480px]">
                  {step.options.map((o) => (
                    <button
                      key={o.id}
                      onClick={() => answer(o.id)}
                      className="px-4 py-3 rounded-xl border bg-card hover:border-primary hover:bg-primary/5 text-left text-[13.5px] transition-all"
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              )}
              {step.options && step.multi && (
                <div className="space-y-2 max-w-[480px]">
                  <div className="grid grid-cols-2 gap-2">
                    {step.options.map((o) => {
                      const sel = multiSel.includes(o.id);
                      return (
                        <button
                          key={o.id}
                          onClick={() => setMultiSel((p) => sel ? p.filter((x) => x !== o.id) : [...p, o.id])}
                          className={cn(
                            "px-4 py-3 rounded-xl border text-left text-[13.5px] transition-all flex items-center justify-between gap-2",
                            sel ? "border-primary bg-primary/5 text-primary" : "bg-card hover:border-primary/40"
                          )}
                        >
                          <span>{o.label}</span>
                          {sel && <Check size={14} />}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={() => answer(multiSel)}
                    disabled={multiSel.length === 0}
                    className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-medium text-[13.5px] hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Continuar <ArrowRight size={14} />
                  </button>
                </div>
              )}
              {step.freeText && (
                <div className="space-y-2 max-w-[520px]">
                  <textarea
                    autoFocus
                    placeholder={step.freeText.placeholder}
                    value={freeText}
                    onChange={(e) => setFreeText(e.target.value)}
                    rows={4}
                    className="w-full px-4 py-3 rounded-xl border bg-card outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-[14px] resize-none transition-all"
                  />
                  <button
                    onClick={() => answer(freeText)}
                    disabled={!freeText.trim()}
                    className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-medium text-[13.5px] hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Listo <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </AgentTurn>
          )}

          {done && (
            <>
              <AgentTurn text={`Perfecto. Te armé un equipo de ${roster.length} ${roster.length === 1 ? "especialista" : "especialistas"} basado en lo que necesitas. Ya están en tus contactos.`} delay={0.2}>
                <div className="space-y-2 max-w-[480px] mt-2">
                  {roster.map((a, i) => (
                    <motion.div
                      key={a.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.08 }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-xl border bg-card"
                    >
                      <Avatar name={a.name} accent={`bg-gradient-to-br ${a.accent}`} online size={36} />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-[13.5px]">{a.name}</div>
                        <div className="text-[11.5px] text-muted-foreground">{a.role} · {a.reason}</div>
                      </div>
                      <span className="text-[10.5px] text-primary font-medium px-2 py-0.5 rounded bg-primary/10">contratado</span>
                    </motion.div>
                  ))}
                </div>
              </AgentTurn>
              <AgentTurn text="¿Listo para entrar a tu espacio de trabajo?" delay={0.5 + roster.length * 0.08}>
                <button
                  onClick={enterWorkspace}
                  className="mt-2 px-5 h-11 rounded-xl bg-primary text-primary-foreground font-medium text-[14px] hover:bg-primary/90 transition-colors flex items-center gap-2"
                >
                  <Sparkles size={14} /> Entrar a Control A <ArrowRight size={14} />
                </button>
              </AgentTurn>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function AgentTurn({ text, children, delay = 0, answered = false }: { text: string; children?: React.ReactNode; delay?: number; answered?: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={cn("flex gap-3", answered && "opacity-60")}
    >
      <Avatar name="Piter" accent="bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600" size={32} />
      <div className="flex-1 min-w-0 space-y-3">
        <div className="px-4 py-2.5 rounded-2xl rounded-bl-sm bg-muted/60 max-w-[560px] text-[14px] leading-relaxed">
          {text}
        </div>
        {children}
      </div>
    </motion.div>
  );
}

function UserBubble({ text }: { text: string }) {
  return (
    <div className="flex justify-end">
      <div className="px-4 py-2.5 rounded-2xl rounded-br-sm bg-primary text-primary-foreground max-w-[420px] text-[14px] leading-relaxed">
        {text}
      </div>
    </div>
  );
}
