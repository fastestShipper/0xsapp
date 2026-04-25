"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, Search, MoreHorizontal, Paperclip, Smile, Send, Mic, MessageCircleOff } from "lucide-react";
import { Avatar } from "@/components/avatar";
import type { Agent, Artifact } from "@/lib/agents";
import { cn } from "@/lib/cn";

interface PrivateChatProps {
  agent: Agent;
  onOpenArtifact: (artifact: Artifact) => void;
}

export function PrivateChat({ agent, onOpenArtifact }: PrivateChatProps) {
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
              {agent.online ? "En linea" : `Visto ${agent.lastSeen}`}
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
            <SilentAgentEmptyState agent={agent} />
          ) : (
            <>
              <div className="flex justify-center">
                <div className="px-3 py-1 rounded-full bg-muted text-[11px] text-muted-foreground">Hoy</div>
              </div>
              <AnimatePresence initial={false}>
                {agent.privateMessages.map((msg, i) => {
                  const isUser = msg.authorId === "user";
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
                        {artifact && <ArtifactPreviewCard artifact={artifact} onOpen={() => onOpenArtifact(artifact)} />}
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

function SilentAgentEmptyState({ agent }: { agent: Agent }) {
  return (
    <div className="flex flex-col items-center text-center pt-16 pb-12 max-w-[440px] mx-auto">
      <Avatar name={agent.name} accent={`bg-gradient-to-br ${agent.accent}`} online={agent.online} size={72} />
      <div className="font-semibold text-[16px] mt-4">{agent.name}</div>
      <div className="text-[12px] text-muted-foreground mb-4">{agent.role}</div>
      <div className="px-4 py-3 rounded-xl bg-muted/40 border text-[13px] text-muted-foreground leading-relaxed flex items-start gap-3">
        <MessageCircleOff size={14} className="mt-0.5 shrink-0 text-primary" />
        <span>{agent.silentNote ?? `${agent.name} no escribira hasta que vos le hables. Asi mantenemos tu bandeja limpia.`}</span>
      </div>
      {agent.pastProjects && agent.pastProjects.length > 0 && (
        <div className="mt-5 text-[11.5px] text-muted-foreground">
          Trabajo contigo en: {agent.pastProjects.join(", ")}
        </div>
      )}
    </div>
  );
}

function ArtifactPreviewCard({ artifact, onOpen }: { artifact: Artifact; onOpen: () => void }) {
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

function Composer({ agentName }: { agentName: string }) {
  return (
    <div className="px-5 pb-5 pt-2">
      <div className="max-w-[760px] mx-auto rounded-2xl border bg-card shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
        <textarea
          placeholder={`Escribirle a ${agentName}...`}
          rows={1}
          className="w-full bg-transparent px-4 pt-3 pb-1 outline-none resize-none text-[14px] placeholder:text-muted-foreground"
        />
        <div className="flex items-center justify-between px-2 pb-2">
          <div className="flex items-center gap-0.5">
            <button className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Paperclip size={15} /></button>
            <button className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Smile size={15} /></button>
            <button className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"><Mic size={15} /></button>
          </div>
          <button className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 text-[13px] font-medium transition-colors">
            <Send size={13} /> Enviar
          </button>
        </div>
      </div>
    </div>
  );
}
