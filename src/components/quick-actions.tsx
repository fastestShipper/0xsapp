"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, X } from "lucide-react";
import { WORKFLOWS, GROUP_LABELS, type Workflow, type WorkflowGroup } from "@/lib/workflows";
import { cn } from "@/lib/cn";

export function QuickActions({ onPick }: { onPick: (workflow: Workflow) => void }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false);
    };
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const groups = Object.keys(GROUP_LABELS) as WorkflowGroup[];

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "h-8 px-3 rounded-lg flex items-center gap-1.5 text-[12.5px] font-medium transition-colors",
          open ? "bg-primary text-primary-foreground" : "border hover:bg-accent text-foreground"
        )}
        title="Acciones rápidas"
      >
        <Zap size={12} /> Acciones
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            className="absolute bottom-full mb-2 left-0 w-[420px] max-h-[440px] overflow-y-auto scrollbar-thin bg-card border rounded-2xl shadow-xl z-30"
          >
            <div className="px-4 py-3 border-b flex items-center justify-between sticky top-0 bg-card">
              <div>
                <div className="font-semibold text-[13px]">Acciones rápidas</div>
                <div className="text-[11px] text-muted-foreground">Piter ejecuta el workflow</div>
              </div>
              <button onClick={() => setOpen(false)} className="h-7 w-7 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground">
                <X size={13} />
              </button>
            </div>

            {groups.map((g) => {
              const items = WORKFLOWS.filter((w) => w.group === g);
              return (
                <div key={g} className="px-3 py-2">
                  <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground px-2 mb-1.5">{GROUP_LABELS[g]}</div>
                  <div className="grid grid-cols-2 gap-1.5">
                    {items.map((w) => (
                      <button
                        key={w.id}
                        onClick={() => { onPick(w); setOpen(false); }}
                        className="px-2.5 py-2 rounded-lg hover:bg-accent flex items-center gap-2 text-left transition-colors"
                      >
                        <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
                          <w.icon size={13} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-[12px] font-medium truncate">{w.label}</div>
                          <div className="text-[10.5px] text-muted-foreground truncate">{w.hint}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
