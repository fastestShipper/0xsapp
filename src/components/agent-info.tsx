"use client";
import { Avatar } from "@/components/avatar";
import type { Agent } from "@/lib/agents";
import { Sparkles, Wrench, FileText } from "lucide-react";
const KIND_LABEL: Record<string, string> = { code: "codigo", preview: "preview", image: "imagen", video: "video", doc: "documento", dashboard: "dashboard" };

export function AgentInfo({ agent, onOpenArtifact }: { agent: Agent; onOpenArtifact: (id: string) => void }) {
  const artifacts = Object.values(agent.artifacts);
  return (
    <aside className="w-[300px] shrink-0 border-l bg-card overflow-y-auto scrollbar-thin">
      <div className="p-5 border-b text-center">
        <div className="flex justify-center mb-3">
          <Avatar name={agent.name} accent={`bg-gradient-to-br ${agent.accent}`} online={agent.online} size={72} />
        </div>
        <div className="font-semibold text-[16px]">{agent.name}</div>
        <div className="text-[12px] text-muted-foreground">{agent.role}</div>
        <div className="text-[12px] text-muted-foreground mt-2 leading-relaxed px-2">{agent.tagline}</div>
        {agent.isConcierge && (
          <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-medium">
            <Sparkles size={11} /> Jefe de Equipo
          </div>
        )}
      </div>

      <Section icon={Wrench} title="Herramientas">
        <div className="flex flex-wrap gap-1.5">
          {agent.tools.map((t) => (
            <span key={t} className="px-2 py-1 rounded-md bg-muted text-[11px] text-foreground">{t}</span>
          ))}
        </div>
      </Section>

      {artifacts.length > 0 && (
        <Section icon={FileText} title={`Artifacts (${artifacts.length})`}>
          <div className="space-y-1.5">
            {artifacts.map((a) => (
              <button
                key={a.id}
                onClick={() => onOpenArtifact(a.id)}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors"
              >
                <div className="text-[12.5px] font-medium truncate">{a.title}</div>
                <div className="text-[11px] text-muted-foreground truncate">{KIND_LABEL[a.kind] ?? a.kind}</div>
              </button>
            ))}
          </div>
        </Section>
      )}
    </aside>
  );
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="p-5 border-b">
      <div className="flex items-center gap-2 mb-3 text-[12px] font-medium text-muted-foreground uppercase tracking-wider">
        <Icon size={12} /> {title}
      </div>
      {children}
    </div>
  );
}
