"use client";
import { Search, Plus, FolderKanban } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { cn } from "@/lib/cn";
import type { Agent, Project } from "@/lib/agents";

export type Selection = { kind: "agent"; id: string } | { kind: "project"; id: string };

export function ContactList({
  piter,
  specialists,
  projects,
  active,
  onSelect,
  onNewProject,
}: {
  piter: Agent;
  specialists: Agent[];
  projects: Project[];
  active: Selection;
  onSelect: (s: Selection) => void;
  onNewProject: () => void;
}) {
  const piterLast = piter.privateMessages[piter.privateMessages.length - 1];
  const isPiterActive = active.kind === "agent" && active.id === piter.id;

  return (
    <div className="w-[340px] shrink-0 border-r flex flex-col bg-card">
      <div className="px-5 pt-5 pb-3 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-[19px] font-semibold tracking-tight">Tu espacio</h1>
          <button
            onClick={onNewProject}
            title="Nuevo proyecto"
            className="h-8 px-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 text-[12px] font-medium transition-colors"
          >
            <Plus size={13} /> Proyecto
          </button>
        </div>
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Buscar"
            className="w-full pl-9 pr-3 h-9 rounded-lg bg-muted/50 border border-transparent focus:border-border focus:bg-background outline-none text-sm transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* PITER */}
        <button
          onClick={() => onSelect({ kind: "agent", id: piter.id })}
          className={cn(
            "w-full px-4 py-3 flex gap-3 items-start text-left transition-all relative border-b",
            isPiterActive ? "bg-accent" : "hover:bg-muted/40"
          )}
        >
          {isPiterActive && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-primary" />}
          <Avatar name={piter.name} accent={`bg-gradient-to-br ${piter.accent}`} online={piter.online} size={44} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2 mb-0.5">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="font-semibold text-[14px] truncate">{piter.name}</span>
                <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium leading-none">JEFE</span>
              </div>
              <span className="text-[11px] text-muted-foreground shrink-0">{piterLast?.ts ?? ""}</span>
            </div>
            <div className="text-[12px] text-muted-foreground truncate mb-1">{piter.role}</div>
            <div className="text-[12.5px] text-muted-foreground truncate">
              {piterLast?.text?.split("\n")[0] ?? "Listo cuando quieras"}
            </div>
          </div>
        </button>

        {/* PROYECTOS ACTIVOS */}
        <SectionHeader icon={FolderKanban} label="Proyectos" count={projects.length} />
        {projects.length === 0 && (
          <div className="px-5 py-3">
            <p className="text-[12px] text-muted-foreground leading-relaxed">
              Aún no tienes proyectos abiertos. Pídele a Piter o presiona <span className="text-primary font-medium">+ Proyecto</span>.
            </p>
          </div>
        )}
        {projects.map((p) => {
          const isActive = active.kind === "project" && active.id === p.id;
          const last = p.messages[p.messages.length - 1];
          const author = p.participantIds.includes(last?.authorId ?? "") ? last?.authorId : "piter";
          return (
            <button
              key={p.id}
              onClick={() => onSelect({ kind: "project", id: p.id })}
              className={cn(
                "w-full px-4 py-3 flex gap-3 items-start text-left transition-all relative",
                isActive ? "bg-accent" : "hover:bg-muted/40"
              )}
            >
              {isActive && <span className="absolute left-0 top-3 bottom-3 w-[3px] rounded-r-full bg-primary" />}
              <ProjectAvatar participantIds={p.participantIds} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2 mb-0.5">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="font-medium text-[13.5px] truncate">{p.title}</span>
                    <StatusDot status={p.status} />
                  </div>
                  <span className="text-[11px] text-muted-foreground shrink-0">{last?.ts ?? p.updatedAt}</span>
                </div>
                <div className="text-[11.5px] text-muted-foreground truncate mb-1">
                  {p.participantIds.length} agentes · {p.eta ?? "en curso"}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="text-[12px] text-muted-foreground truncate flex-1">
                    {author && author !== "piter" ? `${author}: ` : ""}{last?.text?.split("\n")[0] ?? "—"}
                  </div>
                  {p.unread ? (
                    <span className="h-[18px] min-w-[18px] px-1 rounded-full bg-primary text-primary-foreground text-[10.5px] font-medium flex items-center justify-center shrink-0">
                      {p.unread}
                    </span>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}

        {/* ESPECIALISTAS (silentes) */}
        <SectionHeader label="Tu equipo" count={specialists.length} hint="En silencio por defecto. Escríbeles si necesitas algo puntual." />
        {specialists.map((a) => {
          const isActive = active.kind === "agent" && active.id === a.id;
          return (
            <button
              key={a.id}
              onClick={() => onSelect({ kind: "agent", id: a.id })}
              className={cn(
                "w-full px-4 py-2.5 flex gap-3 items-center text-left transition-all relative",
                isActive ? "bg-accent" : "hover:bg-muted/40"
              )}
            >
              {isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] rounded-r-full bg-primary" />}
              <Avatar name={a.name} accent={`bg-gradient-to-br ${a.accent}`} online={a.online} size={36} />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-[13.5px] truncate">{a.name}</div>
                <div className="text-[11.5px] text-muted-foreground truncate">{a.role}</div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SectionHeader({ icon: Icon, label, count, hint }: { icon?: any; label: string; count: number; hint?: string }) {
  return (
    <div className="px-5 pt-5 pb-2 flex flex-col gap-0.5">
      <div className="flex items-center gap-1.5 text-[10.5px] font-semibold uppercase tracking-wider text-muted-foreground">
        {Icon && <Icon size={11} />}
        <span>{label}</span>
        <span className="text-muted-foreground/60">· {count}</span>
      </div>
      {hint && <div className="text-[11px] text-muted-foreground/80">{hint}</div>}
    </div>
  );
}

function StatusDot({ status }: { status: string }) {
  const config: Record<string, string> = {
    active: "bg-emerald-500",
    paused: "bg-amber-500",
    completed: "bg-sky-500",
    archived: "bg-neutral-400",
  };
  return <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", config[status] ?? "bg-neutral-400")} />;
}

function ProjectAvatar({ participantIds }: { participantIds: string[] }) {
  return (
    <div className="relative shrink-0" style={{ width: 44, height: 44 }}>
      <div className="h-full w-full rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 flex items-center justify-center">
        <FolderKanban size={18} className="text-primary" />
      </div>
      <span className="absolute -bottom-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-card border text-[9.5px] font-semibold flex items-center justify-center text-muted-foreground">
        {participantIds.length}
      </span>
    </div>
  );
}
