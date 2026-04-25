"use client";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Pause, Play, Users, MoreHorizontal, MessageSquare, FileText, Sparkles, AlertCircle } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/cn";
import type { Agent, Artifact, Project } from "@/lib/agents";

export function GroupChat({
  project,
  agentsById,
  onOpenArtifact,
  onPauseToggle,
  onMessagePiter,
}: {
  project: Project;
  agentsById: Record<string, Agent>;
  onOpenArtifact: (artifact: Artifact) => void;
  onPauseToggle: () => void;
  onMessagePiter: () => void;
}) {
  const isPaused = project.status === "paused";
  return (
    <div className="flex-1 flex flex-col bg-[hsl(var(--background))] min-w-0">
      <header className="px-5 py-3 border-b bg-card/50 backdrop-blur flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center text-primary shrink-0">
            <Users size={16} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-[15px] truncate">{project.title}</span>
              <StatusBadge status={project.status} />
            </div>
            <div className="text-[12px] text-muted-foreground truncate">
              {project.participantIds.map((id) => agentsById[id]?.name).filter(Boolean).join(" · ")}
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              onClick={onMessagePiter}
              className="h-9 px-3 rounded-lg border hover:bg-accent flex items-center gap-1.5 text-[12.5px] font-medium transition-colors"
              title="Hablar con Piter en privado"
            >
              <MessageSquare size={13} /> Piter en privado
            </button>
            <button
              onClick={onPauseToggle}
              className={cn(
                "h-9 px-3 rounded-lg flex items-center gap-1.5 text-[12.5px] font-medium transition-colors",
                isPaused
                  ? "bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 border border-emerald-500/30"
                  : "bg-red-500/10 text-red-600 hover:bg-red-500/20 border border-red-500/30"
              )}
              title={isPaused ? "Reanudar" : "Pausar al equipo"}
            >
              {isPaused ? <><Play size={13} /> Reanudar</> : <><Pause size={13} /> Pausar</>}
            </button>
            <button className="h-9 w-9 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <MoreHorizontal size={16} />
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11.5px] text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <Sparkles size={11} className="text-primary" /> {project.eta ?? "en curso"}
          </span>
          <span>·</span>
          <span className="flex items-center gap-1.5">
            <FileText size={11} /> {Object.keys(project.artifacts).length} entregables
          </span>
          <span>·</span>
          <span>{project.participantIds.length} agentes</span>
        </div>
      </header>

      {isPaused && (
        <div className="px-5 py-2.5 bg-amber-500/10 border-b border-amber-500/30 flex items-center gap-2 text-[12.5px] text-amber-700 dark:text-amber-400">
          <AlertCircle size={13} />
          <span>El equipo está pausado. Dile a Piter qué cambias y reanuda cuando quieras.</span>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
        <div className="max-w-[820px] mx-auto space-y-3">
          <ProjectGoalCard project={project} agentsById={agentsById} />
          <AnimatePresence initial={false}>
            {project.messages.map((msg, i) => {
              if (msg.kind === "system") {
                return (
                  <motion.div
                    key={msg.id}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.015 }}
                    className="flex justify-center my-2"
                  >
                    <div className="px-3 py-1.5 rounded-full bg-primary/8 border border-primary/15 text-[11.5px] text-primary flex items-center gap-2 max-w-[640px] text-center">
                      <Sparkles size={11} /> {msg.text}
                    </div>
                  </motion.div>
                );
              }
              const author = agentsById[msg.authorId];
              const artifact = msg.artifactId ? project.artifacts[msg.artifactId] : null;
              if (!author) return null;
              const isStatus = msg.kind === "status";
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.015 }}
                  className="flex gap-3"
                >
                  <Avatar name={author.name} accent={`bg-gradient-to-br ${author.accent}`} size={32} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[12.5px]">{author.name}</span>
                      <span className="text-[10.5px] text-muted-foreground">{author.role}</span>
                      <span className="text-[10.5px] text-muted-foreground/70">· {msg.ts}</span>
                    </div>
                    {msg.text && (
                      <div
                        className={cn(
                          "px-3.5 py-2 rounded-xl text-[13.5px] leading-relaxed whitespace-pre-wrap inline-block max-w-[600px]",
                          isStatus
                            ? "bg-muted/40 text-muted-foreground italic text-[12.5px]"
                            : "bg-muted/60"
                        )}
                      >
                        {msg.text}
                      </div>
                    )}
                    {artifact && (
                      <button
                        onClick={() => onOpenArtifact(artifact)}
                        className="mt-2 max-w-[420px] rounded-xl border bg-card hover:border-primary/40 hover:shadow-md transition-all p-3 flex items-center gap-3 group block w-full text-left"
                      >
                        <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-primary font-mono text-sm shrink-0 group-hover:scale-105 transition-transform">
                          {({ code: "</>", preview: "◐", image: "▣", video: "▶", doc: "≡", dashboard: "▤" } as Record<string, string>)[artifact.kind]}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-[13px] truncate">{artifact.title}</div>
                          <div className="text-[11.5px] text-muted-foreground truncate">{artifact.subtitle}</div>
                        </div>
                        <span className="text-[11px] text-primary font-medium shrink-0">Abrir →</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>

      <SupervisorComposer />
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    active: { label: "En curso", cls: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" },
    paused: { label: "Pausado", cls: "bg-amber-500/10 text-amber-600 border-amber-500/30" },
    completed: { label: "Completado", cls: "bg-sky-500/10 text-sky-600 border-sky-500/30" },
    archived: { label: "Archivado", cls: "bg-neutral-500/10 text-neutral-600 border-neutral-500/30" },
  };
  const c = map[status] ?? map.active;
  return <span className={cn("px-1.5 py-0.5 rounded border text-[10px] font-medium leading-none", c.cls)}>{c.label}</span>;
}

function ProjectGoalCard({ project, agentsById }: { project: Project; agentsById: Record<string, Agent> }) {
  return (
    <div className="rounded-xl border bg-gradient-to-br from-primary/5 via-card to-card p-4 mb-4">
      <div className="text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">Objetivo</div>
      <p className="text-[13.5px] text-foreground leading-relaxed">{project.goal}</p>
      <div className="flex items-center gap-2 mt-3">
        <span className="text-[11px] text-muted-foreground">Equipo:</span>
        <div className="flex -space-x-2">
          {project.participantIds.map((id) => {
            const a = agentsById[id];
            if (!a) return null;
            return <Avatar key={id} name={a.name} accent={`bg-gradient-to-br ${a.accent}`} size={22} />;
          })}
        </div>
        <span className="text-[11px] text-muted-foreground ml-auto">Iniciado {project.createdAt}</span>
      </div>
    </div>
  );
}

function SupervisorComposer() {
  return (
    <div className="px-5 pb-5 pt-2 border-t bg-card/30">
      <div className="max-w-[820px] mx-auto rounded-2xl border bg-card shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
        <textarea
          placeholder="Escribe solo si necesitas intervenir. Para ajustes generales, mejor habla con Piter en privado."
          rows={1}
          className="w-full bg-transparent px-4 pt-3 pb-1 outline-none resize-none text-[13.5px] placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <span className="text-[10.5px] text-muted-foreground px-2">Tu intervención pausa al equipo brevemente para considerar el input.</span>
          <button className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-[12.5px] font-medium transition-colors">
            Intervenir
          </button>
        </div>
      </div>
    </div>
  );
}
