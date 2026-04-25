"use client";
import { motion, AnimatePresence } from "framer-motion";
import { X, Download, Share2, ExternalLink, Copy, Check, Maximize2 } from "lucide-react";
import { useState } from "react";
import type { Artifact } from "@/lib/agents";
import { cn } from "@/lib/cn";

const KIND_LABEL: Record<string, string> = { code: "codigo", preview: "preview", image: "imagen", video: "video", doc: "documento", dashboard: "dashboard" };

export function ArtifactPanel({
  artifact,
  onClose,
}: {
  artifact: Artifact | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {artifact && (
        <motion.aside
          key={artifact.id}
          initial={{ width: 0, opacity: 0 }}
          animate={{ width: 480, opacity: 1 }}
          exit={{ width: 0, opacity: 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 32 }}
          className="border-l bg-card overflow-hidden flex flex-col shrink-0"
        >
          <header className="h-[68px] px-5 border-b flex items-center gap-3 shrink-0">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] text-muted-foreground uppercase tracking-wider mb-0.5">
                {KIND_LABEL[artifact.kind] ?? artifact.kind}
              </div>
              <div className="font-semibold text-[14px] truncate">{artifact.title}</div>
            </div>
            <div className="flex items-center gap-0.5">
              <IconBtn title="Compartir"><Share2 size={14} /></IconBtn>
              <IconBtn title="Descargar"><Download size={14} /></IconBtn>
              <IconBtn title="Pantalla completa"><Maximize2 size={14} /></IconBtn>
              <IconBtn title="Cerrar" onClick={onClose}><X size={14} /></IconBtn>
            </div>
          </header>
          <div className="flex-1 overflow-y-auto scrollbar-thin">
            <ArtifactBody artifact={artifact} />
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick?: () => void; title?: string }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="h-9 w-9 rounded-lg hover:bg-accent flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
    >
      {children}
    </button>
  );
}

function ArtifactBody({ artifact }: { artifact: Artifact }) {
  switch (artifact.kind) {
    case "code":
      return <CodeArtifact artifact={artifact} />;
    case "preview":
      return <PreviewArtifact artifact={artifact} />;
    case "image":
      return <ImageArtifact artifact={artifact} />;
    case "video":
      return <VideoArtifact artifact={artifact} />;
    case "doc":
      return <DocArtifact artifact={artifact} />;
    case "dashboard":
      return <DashboardArtifact artifact={artifact} />;
  }
}

function CodeArtifact({ artifact }: { artifact: Artifact }) {
  const [copied, setCopied] = useState(false);
  const lines = (artifact.content ?? "").split("\n");
  return (
    <div className="font-mono text-[12.5px]">
      <div className="flex items-center justify-between px-4 py-2 border-b bg-muted/30">
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider">{artifact.language}</span>
        <button
          onClick={() => {
            navigator.clipboard.writeText(artifact.content ?? "");
            setCopied(true);
            setTimeout(() => setCopied(false), 1600);
          }}
          className="h-7 px-2 rounded text-[11px] hover:bg-accent flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? "Copiado" : "Copiar"}
        </button>
      </div>
      <pre className="p-0 m-0 overflow-x-auto scrollbar-thin">
        {lines.map((line, i) => (
          <div key={i} className="flex hover:bg-accent/40">
            <span className="select-none text-muted-foreground/60 w-12 text-right pr-3 py-0.5 border-r mr-3 shrink-0">{i + 1}</span>
            <code
              className="py-0.5 pr-4 whitespace-pre"
              dangerouslySetInnerHTML={{ __html: highlight(line) }}
            />
          </div>
        ))}
      </pre>
    </div>
  );
}

function escape(s: string) {
  return s.replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" } as Record<string, string>)[c]);
}

function findCommentStart(line: string) {
  let inStr: string | null = null;
  for (let i = 0; i < line.length - 1; i++) {
    const c = line[i];
    if (inStr) {
      if (c === "\\") { i++; continue; }
      if (c === inStr) inStr = null;
    } else {
      if (c === '"' || c === "'" || c === "`") inStr = c;
      else if (c === "/" && line[i + 1] === "/") return i;
    }
  }
  return -1;
}

function highlight(line: string) {
  const commentIdx = findCommentStart(line);
  const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line;
  const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : "";
  let out = escape(codePart);
  out = out.replace(/("[^"]*"|'[^']*'|`[^`]*`)/g, '<span style="color:#10b981">$1</span>');
  out = out.replace(/\b(import|export|from|const|let|var|async|await|function|return|if|else|new|class|interface|type|enum|extends|implements)\b/g, '<span style="color:#a78bfa;font-weight:500">$1</span>');
  out = out.replace(/\b(POST|GET|PUT|DELETE|true|false|null|undefined)\b/g, '<span style="color:#f59e0b">$1</span>');
  out = out.replace(/\b(NextResponse|Request|Response|z|fetch|process|JSON)\b/g, '<span style="color:#06b6d4">$1</span>');
  if (commentPart) out += `<span style="color:hsl(var(--muted-foreground))">${escape(commentPart)}</span>`;
  return out;
}

function PreviewArtifact({ artifact }: { artifact: Artifact }) {
  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-muted/40">
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
        </div>
        <div className="flex-1 px-3 py-1 rounded bg-background border text-[11px] text-muted-foreground truncate">
          app.controla.group{artifact.url}
        </div>
        <button className="h-6 w-6 rounded hover:bg-accent flex items-center justify-center"><ExternalLink size={11} /></button>
      </div>
      <div className="rounded-xl overflow-hidden border bg-gradient-to-br from-background to-muted/30 aspect-[3/4] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="font-semibold text-[15px]">controla.group</div>
          <div className="flex gap-2 text-[11px] text-muted-foreground">
            <span>Trabajo</span><span>Precios</span><span>Contacto</span>
          </div>
        </div>
        <div className="flex-1 p-6 flex flex-col justify-center text-center">
          <h2 className="text-2xl font-bold tracking-tight mb-2">Marketing que se paga solo.</h2>
          <p className="text-[13px] text-muted-foreground max-w-xs mx-auto mb-5">
            Estrategia senior + equipo creativo in-house. En dias, no trimestres.
          </p>
          <div className="flex gap-2 justify-center">
            <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-[12px] font-medium">Agendar auditoria</button>
            <button className="px-4 py-2 rounded-lg border text-[12px] font-medium">Ver trabajos</button>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-2">
            {[1,2,3].map(i=>(
              <div key={i} className="aspect-square rounded-lg bg-gradient-to-br from-sky-200/60 to-blue-100/40 dark:from-blue-900/40 dark:to-sky-950/40" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ImageArtifact({ artifact }: { artifact: Artifact }) {
  return (
    <div className="p-4 grid grid-cols-3 gap-3">
      {[
        "from-violet-400 to-fuchsia-500",
        "from-emerald-400 to-teal-500",
        "from-amber-400 to-rose-500",
      ].map((g, i) => (
        <div key={i} className="aspect-square rounded-xl border overflow-hidden relative group">
          <div className={cn("absolute inset-0 bg-gradient-to-br", g)} />
          <div className="absolute inset-0 flex items-center justify-center text-white font-bold text-3xl tracking-tight">
            {["CA", "ca.", "△"][i]}
          </div>
          <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded bg-black/40 backdrop-blur text-white text-[10px] font-medium opacity-0 group-hover:opacity-100 transition-opacity">
            Direccion {i + 1}
          </div>
        </div>
      ))}
    </div>
  );
}

function VideoArtifact({ artifact }: { artifact: Artifact }) {
  return (
    <div className="p-4">
      <div className="aspect-[9/16] mx-auto max-w-[280px] rounded-2xl bg-gradient-to-br from-sky-800 via-blue-900 to-slate-950 relative overflow-hidden border shadow-xl">
        <div className="absolute inset-0 grain" />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-6">
          <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center mb-4 cursor-pointer hover:scale-110 transition-transform">
            <span className="ml-1">▶</span>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] opacity-70 mb-2">Corte 1 · 0:30</div>
          <div className="text-center text-2xl font-bold leading-tight">Marketing<br/>que se<br/>paga solo.</div>
        </div>
        <div className="absolute bottom-4 left-4 right-4">
          <div className="h-1 rounded-full bg-white/20 overflow-hidden">
            <div className="h-full w-1/3 bg-white/80 rounded-full" />
          </div>
          <div className="flex justify-between text-[10px] text-white/60 mt-1">
            <span>0:10</span><span>0:30</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function DocArtifact({ artifact }: { artifact: Artifact }) {
  const lines = (artifact.content ?? "").split("\n");
  return (
    <article className="p-8 max-w-none prose-sm">
      {lines.map((line, i) => {
        if (line.startsWith("# ")) return <h1 key={i} className="text-2xl font-bold tracking-tight mb-4">{line.slice(2)}</h1>;
        if (line.startsWith("— ")) return <p key={i} className="text-[13px] text-muted-foreground italic">{line}</p>;
        if (line.startsWith("[")) return <p key={i} className="mt-4"><a className="inline-block px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium text-[13px] no-underline">{line.slice(1, -1)}</a></p>;
        if (!line.trim()) return <div key={i} className="h-3" />;
        return <p key={i} className="text-[14px] leading-relaxed mb-3">{line}</p>;
      })}
    </article>
  );
}

function DashboardArtifact({ artifact }: { artifact: Artifact }) {
  const competitors = [
    { name: "AgencyOne", price: "$$$$", channels: 4, score: 84 },
    { name: "PixelForge", price: "$$$", channels: 3, score: 71 },
    { name: "Helix Co", price: "$$", channels: 5, score: 68 },
    { name: "Northlight", price: "$$$$", channels: 2, score: 64 },
    { name: "Okra", price: "$$", channels: 4, score: 59 },
  ];
  return (
    <div className="p-5 space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Agencias", val: "12" },
          { label: "Precio prom.", val: "$$$" },
          { label: "Canal top", val: "SEO" },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border p-3">
            <div className="text-[11px] text-muted-foreground mb-1">{s.label}</div>
            <div className="text-xl font-bold tracking-tight">{s.val}</div>
          </div>
        ))}
      </div>
      <div className="rounded-xl border overflow-hidden">
        <div className="px-4 py-3 border-b flex items-center justify-between bg-muted/30">
          <div className="font-medium text-[13px]">Top 5 por visibilidad</div>
          <span className="text-[11px] text-muted-foreground">en vivo</span>
        </div>
        <div className="divide-y">
          {competitors.map((c, i) => (
            <div key={c.name} className="px-4 py-3 flex items-center gap-3">
              <span className="text-muted-foreground text-[11px] w-4">{i + 1}</span>
              <span className="font-medium text-[13px] flex-1">{c.name}</span>
              <span className="text-[11.5px] text-muted-foreground w-12">{c.price}</span>
              <span className="text-[11.5px] text-muted-foreground w-16">{c.channels} can</span>
              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                <div className="h-full bg-primary rounded-full" style={{ width: `${c.score}%` }} />
              </div>
              <span className="text-[12px] font-semibold w-8 text-right">{c.score}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="rounded-xl border p-4">
        <div className="font-medium text-[13px] mb-3">Mix de canales en el sector</div>
        <div className="flex items-end gap-2 h-32">
          {[
            { ch: "SEO", v: 92 },
            { ch: "Paid", v: 71 },
            { ch: "Contenido", v: 64 },
            { ch: "Email", v: 48 },
            { ch: "Social", v: 39 },
            { ch: "PR", v: 22 },
          ].map((b) => (
            <div key={b.ch} className="flex-1 flex flex-col items-center gap-1">
              <div className="w-full rounded-t bg-gradient-to-t from-primary to-primary/40 transition-all" style={{ height: `${b.v}%` }} />
              <span className="text-[10px] text-muted-foreground">{b.ch}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
