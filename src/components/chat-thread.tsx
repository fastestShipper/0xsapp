"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, Search, MoreHorizontal, Paperclip, Smile, Send, Mic, MessageCircle } from "lucide-react";
import { Avatar } from "@/components/avatar";
import type { Agent, Artifact } from "@/lib/agents";
import { cn } from "@/lib/cn";

function ArtifactPreview({ artifact, onOpen }: { artifact: Artifact; onOpen: () => void }) {
  const icons: Record<string, string> = { code: "</>", preview: "◐", image: "▣", video: "▶", doc: "≡", dashboard: "▤" };
  return (
    <button
      onClick={onOpen}
      className="mt-2 w-full max-w-[360px] rounded-xl border bg-background hover:border-primary/40 hover:shadow-md transition-all p-3 text-left flex items-center gap-3 group"
    >
      <div className="h-11 w-11 rounded-lg bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center text-primary font-mono text-sm shrink-0 group-hover:scale-105 transition-transform">
        {icons[artifact.kind]}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-[13.5px] truncate">{artifact.title}</div>
        <div className="text-[11.5px] text-muted-foreground truncate">{artifact.subtitle}</div>
      </div>
      <span className="text-[11px] text-primary font-medium shrink-0">Abrir →</span>
    </button>
  );
}

export function ChatThread({
  agent,
  onOpenArtifact,
}: {
  agent: Agent;
  onOpenArtifact: (artifact: Artifact) => void;
}) {
  const isEmpty = agent.privateMessages.length === 0;
  return (
    <div className="flex-1 flex flex-col bg-[hsl(var(--background))] min-w-0">
      <header className="h-[68px] px-5 border-b flex items-center gap-3 bg-card/50 backdrop-blur">
        <Avatar name={agent.name} accent={`bg-gradient-to-br ${agent.accent}`} online={agent.online} size={40} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[15px]">{agent.name}</span>
            <span className="text-[12px] text-muted-foreground">·</span>
            <span className="text-[12px] text-muted-foreground truncate">{agent.role}</span>
          </div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={cn("h-1.5 w-1.5 rounded-full", agent.online ? "bg-emerald-500 animate-pulse-dot" : "bg-neutral-400")} />
            <span className="text-[11.5px] text-muted-foreground">
              {agent.online ? "En línea" : `Visto ${agent.lastSeen}`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[Search, Phone, Video, MoreHorizontal].map((Icon, i) => (
            <button key={i} className="h-9 w-9 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
              <Icon size={16} />
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
        <div className="max-w-[760px] mx-auto space-y-4">
          {isEmpty ? (
            <SilentEmptyState agent={agent} />
          ) : (
            <>
              <div className="flex justify-center">
                <div className="px-3 py-1 rounded-full bg-muted text-[11px] text-muted-foreground">Hoy</div>
              </div>
              <AnimatePresence initial={false}>
                {agent.privateMessages.map((msg, i) => {
                  const isUser = msg.authorId === "you";
                  const artifact = msg.artifactId ? agent.artifacts[msg.artifactId] : null;
                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.02 }}
                      className={cn("flex gap-3", isUser ? "justify-end" : "justify-start")}
                    >
                      {!isUser && <Avatar name={agent.name} accent={`bg-gradient-to-br ${agent.accent}`} size={32} />}
                      <div className={cn("max-w-[560px] flex flex-col", isUser ? "items-end" : "items-start")}>
                        {msg.text && (
                          <div
                            className={cn(
                              "px-4 py-2.5 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap",
                              isUser ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted/60 rounded-bl-sm"
                            )}
                          >
                            {msg.text}
                          </div>
                        )}
                        {artifact && <ArtifactPreview artifact={artifact} onOpen={() => onOpenArtifact(artifact)} />}
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          <span className="text-[10.5px] text-muted-foreground">{msg.ts}</span>
                          {isUser && msg.status && <span className="text-[10.5px] text-primary">✓✓</span>}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      <Composer agentName={agent.name} />
    </div>
  );
}

function SilentEmptyState({ agent }: { agent: Agent }) {
  return (
    <div className="flex flex-col items-center text-center py-16 px-6 max-w-[460px] mx-auto">
      <Avatar name={agent.name} accent={`bg-gradient-to-br ${agent.accent}`} online={agent.online} size={72} />
      <h2 className="mt-4 font-semibold text-[18px]">{agent.name}</h2>
      <p className="text-[13px] text-muted-foreground mt-1">{agent.role}</p>
      <div className="mt-6 w-full rounded-xl border bg-card p-4">
        <div className="flex items-start gap-2.5 text-left">
          <MessageCircle size={14} className="text-primary mt-0.5 shrink-0" />
          <p className="text-[13px] text-muted-foreground leading-relaxed">
            {agent.silentNote ?? `${agent.name} solo te responde si le escribes primero. No vas a recibir mensajes proactivos.`}
          </p>
        </div>
      </div>
      <p className="text-[11.5px] text-muted-foreground/80 mt-4">
        ¿Necesitas coordinar a varios? Habla con Piter para abrir un proyecto.
      </p>
    </div>
  );
}

function Composer({ agentName }: { agentName: string }) {
  return (
    <div className="px-5 pb-5 pt-2">
      <div className="max-w-[760px] mx-auto rounded-2xl border bg-card shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
        <textarea
          placeholder={`Escribir a ${agentName}...`}
          rows={1}
          className="w-full bg-transparent px-4 pt-3 pb-1 outline-none resize-none text-[14px] placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            {[Paperclip, Smile, Mic].map((Icon, i) => (
              <button key={i} className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                <Icon size={15} />
              </button>
            ))}
          </div>
          <button className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 text-[13px] font-medium transition-colors">
            <Send size={13} /> Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
