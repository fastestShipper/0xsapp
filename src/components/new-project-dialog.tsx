"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, Check } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/cn";
import { SPECIALISTS } from "@/lib/agents";

export type NewProjectInput = {
  goal: string;
  participantIds: string[];
};

const SUGGESTION_KEYWORDS: { match: RegExp; ids: string[] }[] = [
  { match: /(landing|web|sitio|pagina|sit io|app|frontend)/i, ids: ["nova", "maya"] },
  { match: /(copy|texto|post|articulo|email|mail)/i, ids: ["maya"] },
  { match: /(investiga|research|competidor|mercado|analiza)/i, ids: ["leo"] },
  { match: /(logo|brand|marca|identidad|diseno)/i, ids: ["kai"] },
  { match: /(video|reel|ad|tiktok|youtube)/i, ids: ["rio"] },
  { match: /(automatiza|workflow|integra|api)/i, ids: ["nova"] },
];

function suggestTeam(goal: string): string[] {
  const matched = new Set<string>();
  for (const rule of SUGGESTION_KEYWORDS) {
    if (rule.match.test(goal)) rule.ids.forEach((id) => matched.add(id));
  }
  if (matched.size === 0) {
    matched.add("leo");
    matched.add("maya");
  }
  return Array.from(matched);
}

export function NewProjectDialog({
  open,
  onClose,
  onCreate,
}: {
  open: boolean;
  onClose: () => void;
  onCreate: (input: NewProjectInput) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [goal, setGoal] = useState("");
  const [team, setTeam] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState(false);

  const reset = () => { setStep(1); setGoal(""); setTeam([]); setConfirmed(false); };

  const submitGoal = () => {
    if (!goal.trim()) return;
    setTeam(suggestTeam(goal));
    setStep(2);
  };

  const toggle = (id: string) =>
    setTeam((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const finish = () => {
    onCreate({ goal: goal.trim(), participantIds: ["piter", ...team] });
    reset();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[560px] bg-card border rounded-2xl shadow-2xl overflow-hidden"
          >
            <header className="px-5 py-4 border-b flex items-center gap-3">
              <Avatar name="Piter" accent="bg-gradient-to-br from-sky-400 via-blue-500 to-blue-600" online size={36} />
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-[14px]">Nuevo proyecto con Piter</div>
                <div className="text-[11.5px] text-muted-foreground">Paso {step} de 3</div>
              </div>
              <button onClick={onClose} className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <X size={14} />
              </button>
            </header>

            <div className="px-5 py-5">
              {step === 1 && (
                <div className="space-y-3">
                  <p className="text-[14px] leading-relaxed">¿Qué quieres lograr en este proyecto?</p>
                  <textarea
                    autoFocus
                    rows={4}
                    placeholder="Ej: Lanzar la landing v1 de la agencia, optimizada para captar auditorías en 7 días."
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border bg-background outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 text-[14px] resize-none transition-all"
                  />
                  <button
                    onClick={submitGoal}
                    disabled={!goal.trim()}
                    className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-medium text-[13.5px] hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                  >
                    Siguiente <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-3">
                  <p className="text-[14px] leading-relaxed">
                    Te propongo este equipo. Puedes sumar o quitar a quien necesites.
                  </p>
                  <div className="space-y-1.5">
                    {SPECIALISTS.map((a) => {
                      const sel = team.includes(a.id);
                      return (
                        <button
                          key={a.id}
                          onClick={() => toggle(a.id)}
                          className={cn(
                            "w-full px-3 py-2.5 rounded-xl border flex items-center gap-3 text-left transition-all",
                            sel ? "border-primary bg-primary/5" : "hover:border-primary/30"
                          )}
                        >
                          <Avatar name={a.name} accent={`bg-gradient-to-br ${a.accent}`} size={32} />
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-[13px]">{a.name}</div>
                            <div className="text-[11px] text-muted-foreground truncate">{a.role}</div>
                          </div>
                          {sel && <Check size={14} className="text-primary" />}
                        </button>
                      );
                    })}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button onClick={() => setStep(1)} className="h-10 px-4 rounded-xl border text-[13px] hover:bg-accent transition-colors">
                      Atrás
                    </button>
                    <button
                      onClick={() => setStep(3)}
                      disabled={team.length === 0}
                      className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-medium text-[13.5px] hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                    >
                      Confirmar equipo <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-4">
                  <div className="rounded-xl border bg-gradient-to-br from-primary/5 to-card p-4">
                    <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Objetivo</div>
                    <p className="text-[13.5px] leading-relaxed">{goal}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-[11px] text-muted-foreground">Equipo:</span>
                      <div className="flex -space-x-2">
                        {team.map((id) => {
                          const a = SPECIALISTS.find((s) => s.id === id);
                          if (!a) return null;
                          return <Avatar key={id} name={a.name} accent={`bg-gradient-to-br ${a.accent}`} size={22} />;
                        })}
                      </div>
                    </div>
                  </div>
                  <p className="text-[13px] text-muted-foreground leading-relaxed">
                    Voy a abrir el chat del proyecto y empiezo. Te aviso si necesito tu input. Mientras tanto solo monitoreas, y si quieres ajustar, háblame en privado o usa el botón Pausar.
                  </p>
                  <div className="flex gap-2">
                    <button onClick={() => setStep(2)} className="h-10 px-4 rounded-xl border text-[13px] hover:bg-accent transition-colors">
                      Atras
                    </button>
                    <button
                      onClick={finish}
                      className="flex-1 h-10 rounded-xl bg-primary text-primary-foreground font-medium text-[13.5px] hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                    >
                      <Sparkles size={14} /> Abrir proyecto
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
