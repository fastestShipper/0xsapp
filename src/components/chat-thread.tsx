"use client";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Video, Search, MoreHorizontal, Paperclip, Smile, Send, Mic, Square, MessageCircle, FileText, Play, Pause, X } from "lucide-react";
import { Avatar } from "@/components/avatar";
import type { Agent, Artifact, Attachment, Message } from "@/lib/agents";
import { cn } from "@/lib/cn";
import { QuickActions } from "@/components/quick-actions";

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
  onSend,
}: {
  agent: Agent;
  onOpenArtifact: (artifact: Artifact) => void;
  onSend: (input: { text?: string; attachments?: Attachment[] }) => void;
}) {
  const isEmpty = agent.privateMessages.length === 0;
  const scrollRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [agent.privateMessages.length, agent.id]);

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

      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-6 py-6">
        <div className="max-w-[760px] mx-auto space-y-4">
          {isEmpty ? (
            <SilentEmptyState agent={agent} />
          ) : (
            <>
              <div className="flex justify-center">
                <div className="px-3 py-1 rounded-full bg-muted text-[11px] text-muted-foreground">Hoy</div>
              </div>
              <AnimatePresence initial={false}>
                {agent.privateMessages.map((msg, i) => (
                  <MessageBubble key={msg.id} msg={msg} agent={agent} onOpenArtifact={onOpenArtifact} index={i} />
                ))}
              </AnimatePresence>
            </>
          )}
        </div>
      </div>

      <Composer agentName={agent.name} onSend={onSend} showQuickActions={agent.isConcierge} />
    </div>
  );
}

const URL_RE = /https?:\/\/[^\s)>\]]+/g;
const IMAGE_HOSTS = /(cdn\.muapi\.ai|\.png|\.jpg|\.jpeg|\.webp|\.gif)$/i;

function detectInlineArtifacts(text: string): Artifact[] {
  const urls = text.match(URL_RE) ?? [];
  const seen = new Set<string>();
  const artifacts: Artifact[] = [];
  for (const url of urls) {
    if (seen.has(url)) continue;
    seen.add(url);
    const cleaned = url.replace(/[.,)]+$/, "");
    if (IMAGE_HOSTS.test(cleaned) || /image|photo|render|mockup/i.test(cleaned)) {
      artifacts.push({
        id: `inline-${cleaned}`,
        kind: "image",
        title: cleaned.split("/").pop() ?? "Imagen",
        subtitle: new URL(cleaned).hostname,
        url: cleaned,
      });
    }
  }
  return artifacts;
}

function MessageBubble({ msg, agent, onOpenArtifact, index }: { msg: Message; agent: Agent; onOpenArtifact: (a: Artifact) => void; index: number }) {
  const isUser = msg.authorId === "you";
  const artifact = msg.artifactId ? agent.artifacts[msg.artifactId] : null;
  const inlineArtifacts = !isUser && msg.text ? detectInlineArtifacts(msg.text) : [];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.02 }}
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
        {msg.attachments?.map((att) => (
          <AttachmentBubble key={att.id} attachment={att} isUser={isUser} />
        ))}
        {artifact && <ArtifactPreview artifact={artifact} onOpen={() => onOpenArtifact(artifact)} />}
        {inlineArtifacts.map((a) => (
          <button
            key={a.id}
            onClick={() => onOpenArtifact(a)}
            className="mt-2 max-w-[320px] rounded-xl overflow-hidden border hover:border-primary/40 hover:shadow-md transition-all block"
          >
            <img src={a.url} alt={a.title} className="w-full h-auto block" />
          </button>
        ))}
        <div className="flex items-center gap-1.5 mt-1 px-1">
          <span className="text-[10.5px] text-muted-foreground">{msg.ts}</span>
          {isUser && msg.status && <span className="text-[10.5px] text-primary">✓✓</span>}
        </div>
      </div>
    </motion.div>
  );
}

function AttachmentBubble({ attachment, isUser }: { attachment: Attachment; isUser: boolean }) {
  if (attachment.kind === "audio") return <VoiceBubble attachment={attachment} isUser={isUser} />;
  if (attachment.kind === "image") {
    return (
      <div className="mt-1 max-w-[320px] rounded-xl overflow-hidden border">
        <img src={attachment.url} alt={attachment.name} className="w-full h-auto block" />
      </div>
    );
  }
  return (
    <div className={cn(
      "mt-1 max-w-[320px] rounded-xl border p-3 flex items-center gap-3",
      isUser ? "bg-primary/10 border-primary/30" : "bg-muted/40"
    )}>
      <div className="h-10 w-10 rounded-lg bg-primary/15 flex items-center justify-center text-primary shrink-0">
        <FileText size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium truncate">{attachment.name}</div>
        <div className="text-[11px] text-muted-foreground">{attachment.size ? `${Math.round(attachment.size / 1024)} KB` : ""}</div>
      </div>
      <a href={attachment.url} download={attachment.name} className="text-[11px] text-primary font-medium hover:underline shrink-0">Abrir</a>
    </div>
  );
}

function VoiceBubble({ attachment, isUser }: { attachment: Attachment; isUser: boolean }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const duration = (attachment.durationMs ?? 0) / 1000;

  const toggle = () => {
    const a = audioRef.current;
    if (!a) return;
    if (playing) { a.pause(); setPlaying(false); }
    else { a.play(); setPlaying(true); }
  };

  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onTime = () => setProgress(a.currentTime);
    const onEnd = () => { setPlaying(false); setProgress(0); };
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);
    return () => { a.removeEventListener("timeupdate", onTime); a.removeEventListener("ended", onEnd); };
  }, []);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  const pct = duration > 0 ? Math.min(100, (progress / duration) * 100) : 0;

  return (
    <div className={cn(
      "mt-1 min-w-[220px] max-w-[320px] rounded-2xl px-3 py-2.5 flex items-center gap-3",
      isUser ? "bg-primary text-primary-foreground" : "bg-muted/60"
    )}>
      <button
        onClick={toggle}
        className={cn(
          "h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-transform hover:scale-105",
          isUser ? "bg-white/20 hover:bg-white/30" : "bg-primary text-primary-foreground"
        )}
      >
        {playing ? <Pause size={13} /> : <Play size={13} className="ml-0.5" />}
      </button>
      <div className="flex-1 flex flex-col gap-1.5 min-w-0">
        <div className={cn("h-1 rounded-full overflow-hidden", isUser ? "bg-white/20" : "bg-foreground/10")}>
          <div className={cn("h-full rounded-full transition-all", isUser ? "bg-white/80" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
        <div className={cn("text-[10.5px] tabular-nums", isUser ? "text-primary-foreground/70" : "text-muted-foreground")}>
          {playing ? fmt(progress) : fmt(duration)}
        </div>
      </div>
      <audio ref={audioRef} src={attachment.url} preload="metadata" />
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

function Composer({ agentName, onSend, showQuickActions }: { agentName: string; onSend: (input: { text?: string; attachments?: Attachment[] }) => void; showQuickActions?: boolean }) {
  const [text, setText] = useState("");
  const [pending, setPending] = useState<Attachment[]>([]);
  const [recording, setRecording] = useState(false);
  const [recDuration, setRecDuration] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startedAtRef = useRef<number>(0);
  const tickRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const submit = () => {
    if (!text.trim() && pending.length === 0) return;
    onSend({ text: text.trim() || undefined, attachments: pending.length ? pending : undefined });
    setText("");
    setPending([]);
  };

  const onKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  const onPickFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    const next: Attachment[] = files.map((f) => ({
      id: `a-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      kind: f.type.startsWith("image/") ? "image" : "file",
      name: f.name,
      size: f.size,
      mime: f.type,
      url: URL.createObjectURL(f),
    }));
    setPending((p) => [...p, ...next]);
    e.target.value = "";
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus") ? "audio/webm;codecs=opus" : "audio/webm";
      const rec = new MediaRecorder(stream, { mimeType: mime });
      chunksRef.current = [];
      rec.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mime });
        const durationMs = Date.now() - startedAtRef.current;
        const att: Attachment = {
          id: `v-${Date.now()}`,
          kind: "audio",
          name: `mensaje-de-voz-${new Date().toISOString().slice(11, 19)}.webm`,
          size: blob.size,
          mime,
          durationMs,
          url: URL.createObjectURL(blob),
        };
        onSend({ attachments: [att] });
        stream.getTracks().forEach((t) => t.stop());
        if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
        setRecDuration(0);
        setRecording(false);
      };
      recorderRef.current = rec;
      startedAtRef.current = Date.now();
      rec.start();
      setRecording(true);
      tickRef.current = window.setInterval(() => setRecDuration(Date.now() - startedAtRef.current), 200);
    } catch {
      alert("No pudimos acceder al micrófono. Revisa los permisos del navegador.");
    }
  };

  const stopRecording = () => recorderRef.current?.stop();

  const cancelRecording = () => {
    const rec = recorderRef.current;
    if (!rec) return;
    rec.onstop = () => {
      rec.stream.getTracks().forEach((t) => t.stop());
      if (tickRef.current) { window.clearInterval(tickRef.current); tickRef.current = null; }
      setRecDuration(0);
      setRecording(false);
    };
    rec.stop();
  };

  if (recording) {
    const s = Math.floor(recDuration / 1000);
    return (
      <div className="px-5 pb-5 pt-2">
        <div className="max-w-[760px] mx-auto rounded-2xl border bg-red-500/5 border-red-500/30 px-4 py-3 flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[13px] text-red-600 dark:text-red-400 font-medium">Grabando...</span>
          <span className="text-[12.5px] tabular-nums text-muted-foreground ml-auto">
            {Math.floor(s / 60)}:{(s % 60).toString().padStart(2, "0")}
          </span>
          <button
            onClick={cancelRecording}
            className="h-9 w-9 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
            title="Cancelar"
          >
            <X size={15} />
          </button>
          <button
            onClick={stopRecording}
            className="h-9 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 flex items-center gap-1.5 text-[13px] font-medium transition-colors"
          >
            <Send size={13} /> Enviar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 pb-5 pt-2">
      <div className="max-w-[760px] mx-auto">
        {pending.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {pending.map((a) => (
              <div key={a.id} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/60 border text-[12px]">
                {a.kind === "image" ? <span>▣</span> : <FileText size={12} />}
                <span className="max-w-[160px] truncate">{a.name}</span>
                <button onClick={() => setPending((p) => p.filter((x) => x.id !== a.id))} className="text-muted-foreground hover:text-foreground">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}
        <div className="rounded-2xl border bg-card shadow-sm focus-within:border-primary/40 focus-within:shadow-md transition-all">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKey}
            placeholder={`Escribir a ${agentName}... (Enter para enviar)`}
            rows={1}
            className="w-full bg-transparent px-4 pt-3 pb-1 outline-none resize-none text-[14px] placeholder:text-muted-foreground"
          />
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-1">
              <input ref={fileInputRef} type="file" multiple className="hidden" onChange={onPickFile} />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Adjuntar archivo"
              >
                <Paperclip size={15} />
              </button>
              <button
                onClick={startRecording}
                className="h-8 w-8 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                title="Grabar mensaje de voz"
              >
                <Mic size={15} />
              </button>
              {showQuickActions && (
                <QuickActions onPick={(w) => onSend({ text: w.prompt })} />
              )}
            </div>
            <button
              onClick={submit}
              disabled={!text.trim() && pending.length === 0}
              className="h-8 px-3 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 text-[13px] font-medium transition-colors"
            >
              <Send size={13} /> Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
