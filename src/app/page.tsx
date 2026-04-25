"use client";
import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/sidebar";
import { ContactList, type Selection } from "@/components/contact-list";
import { ChatThread } from "@/components/chat-thread";
import { GroupChat } from "@/components/group-chat";
import { ArtifactPanel } from "@/components/artifact-panel";
import { AgentInfo } from "@/components/agent-info";
import { NewProjectDialog, type NewProjectInput } from "@/components/new-project-dialog";
import { AGENTS, PITER, SPECIALISTS, PROJECTS, getAgent, type Agent, type Artifact, type Attachment, type Message, type Project } from "@/lib/agents";

const now = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};
const uid = () => `m-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export default function Home() {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>({ kind: "agent", id: PITER.id });
  const [openArtifact, setOpenArtifact] = useState<Artifact | null>(null);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [hiredIds, setHiredIds] = useState<string[]>([]);
  const [showNewProject, setShowNewProject] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("controla:onboarded") !== "true") {
      router.replace("/onboarding");
      return;
    }
    try {
      const stored = JSON.parse(localStorage.getItem("controla:roster") ?? "[]");
      setHiredIds(Array.isArray(stored) ? stored : []);
    } catch {
      setHiredIds([]);
    }
    setReady(true);
  }, [router]);

  const agentsById = useMemo(() => Object.fromEntries(agents.map((a) => [a.id, a])), [agents]);

  if (!ready) return null;

  let activeProject: Project | null = null;
  let activeAgent: Agent = agentsById[PITER.id] ?? PITER;
  if (selection.kind === "project") {
    activeProject = projects.find((p) => p.id === selection.id) ?? null;
  } else {
    activeAgent = agentsById[selection.id] ?? PITER;
  }

  const handleSendToAgent = async (agentId: string, input: { text?: string; attachments?: Attachment[] }) => {
    // Upload any attachments to get public URLs Piter can use.
    let uploaded: Attachment[] = [];
    if (input.attachments?.length) {
      uploaded = await Promise.all(input.attachments.map(async (att) => {
        try {
          const blob = await (await fetch(att.url)).blob();
          const fd = new FormData();
          fd.append("file", new File([blob], att.name, { type: att.mime ?? blob.type }));
          const res = await fetch("/api/upload", { method: "POST", body: fd });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error ?? "upload failed");
          return { ...att, url: data.url };
        } catch {
          return att;
        }
      }));
    }

    const userMsg: Message = {
      id: uid(),
      authorId: "you",
      text: input.text,
      attachments: uploaded.length ? uploaded : input.attachments,
      ts: now(),
      status: "sent",
    };
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, privateMessages: [...a.privateMessages, userMsg] } : a));

    // Compose the message Piter receives: include attachment URLs inline so he can act on them.
    const imageUrls = uploaded.filter((a) => a.kind === "image").map((a) => a.url);
    const audioAttachments = uploaded.filter((a) => a.kind === "audio");
    const otherAttachments = uploaded.filter((a) => a.kind !== "image" && a.kind !== "audio");
    let outboundText = input.text ?? "";

    // Transcribe voice messages so Piter receives the text.
    if (audioAttachments.length) {
      const transcripts = await Promise.all(audioAttachments.map(async (a) => {
        try {
          const r = await fetch("/api/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: a.url }),
          });
          const d = await r.json();
          return d.text || "(audio sin transcribir)";
        } catch {
          return "(audio sin transcribir)";
        }
      }));
      const joined = transcripts.join(" ").trim();
      if (joined) {
        outboundText = (outboundText ? outboundText + "\n\n" : "") + `(Mensaje de voz transcrito) ${joined}`;
      }
    }

    if (imageUrls.length) {
      outboundText += `\n\n=== ADJUNTOS_IMAGEN === El usuario adjuntó ${imageUrls.length} ${imageUrls.length === 1 ? "imagen" : "imágenes"}:\n${imageUrls.map((u, i) => `  ${i + 1}. ${u}`).join("\n")}`;
    }
    if (otherAttachments.length) {
      outboundText += `\n\n=== ADJUNTOS_ARCHIVO ===\n${otherAttachments.map((a) => `  - ${a.name}: ${a.url}`).join("\n")}`;
    }

    if (!outboundText.trim()) return;

    // Detect heavy workflows so we can show a more reassuring typing hint.
    const lower = (input.text ?? "").toLowerCase();
    let hint: string | undefined;
    const imageKeywords = ["imagen", "image", "mockup", "foto", "render", "logo", "outfit", "upscale", "faceswap", "producto", "fondo"];
    const videoKeywords = ["video", "reel", "clip"];
    if (imageKeywords.some((k) => lower.includes(k))) {
      hint = "Generando imagen, ~15-45 s";
    } else if (videoKeywords.some((k) => lower.includes(k))) {
      hint = "Procesando video, puede tardar varios minutos";
    } else {
      hint = "Pensando...";
    }

    const typingId = uid();
    const typingMsg: any = { id: typingId, authorId: agentId, text: "...", ts: now(), kind: "status", hint };
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, privateMessages: [...a.privateMessages, typingMsg] } : a));

    const userId = typeof window !== "undefined" ? (localStorage.getItem("controla:user_id") ?? "anon") : "anon";
    const userName = typeof window !== "undefined" ? (localStorage.getItem("controla:user_name") ?? "") : "";

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, message: outboundText, user_id: userId, user_name: userName }),
      });
      const data = await res.json();
      const reply: Message = {
        id: uid(),
        authorId: agentId,
        text: data.text ?? data.error ?? "(sin respuesta)",
        ts: now(),
      };
      setAgents((prev) => prev.map((a) => a.id === agentId ? {
        ...a,
        privateMessages: [...a.privateMessages.filter((m) => m.id !== typingId), reply]
      } : a));
    } catch (err: any) {
      const reply: Message = {
        id: uid(),
        authorId: agentId,
        text: "Error de conexión. Intenta de nuevo.",
        ts: now(),
      };
      setAgents((prev) => prev.map((a) => a.id === agentId ? {
        ...a,
        privateMessages: [...a.privateMessages.filter((m) => m.id !== typingId), reply]
      } : a));
    }
  };

  const handleSendToProject = (projectId: string, input: { text?: string; attachments?: Attachment[] }) => {
    const userMsg: Message = {
      id: uid(),
      authorId: "you",
      text: input.text,
      attachments: input.attachments,
      ts: now(),
    };
    setProjects((prev) => prev.map((p) => p.id === projectId ? { ...p, messages: [...p.messages, userMsg], updatedAt: `Hoy ${now()}` } : p));
  };

  const handleNewProject = (input: NewProjectInput) => {
    const id = `proj-${Date.now()}`;
    const ts = now();
    const participantNames = input.participantIds
      .filter((x) => x !== "piter")
      .map((x) => agentsById[x]?.name)
      .filter(Boolean)
      .join(", ");
    const newProject: Project = {
      id,
      title: input.goal.length > 60 ? input.goal.slice(0, 57) + "..." : input.goal,
      goal: input.goal,
      status: "active",
      createdAt: `Hoy ${ts}`,
      updatedAt: `Hoy ${ts}`,
      participantIds: input.participantIds,
      eta: "Estimando duración...",
      messages: [
        { id: `${id}-m1`, authorId: "piter", text: `Abrimos el proyecto. Equipo: ${participantNames || "yo solo"}. Yo coordino.`, ts, kind: "system" },
      ],
      artifacts: {},
    };
    setProjects((p) => [newProject, ...p]);
    setSelection({ kind: "project", id });
    setShowNewProject(false);
    setOpenArtifact(null);
  };

  const togglePause = () => {
    if (!activeProject) return;
    setProjects((all) => all.map((p) => p.id === activeProject!.id ? { ...p, status: p.status === "paused" ? "active" : "paused" } : p));
  };

  const messagePiter = () => {
    setSelection({ kind: "agent", id: PITER.id });
    setOpenArtifact(null);
  };

  return (
    <>
      <div className="h-screen w-screen flex overflow-hidden">
        <Sidebar />
        <ContactList
          piter={agentsById[PITER.id] ?? PITER}
          specialists={agents.filter((a) => !a.isConcierge && hiredIds.includes(a.id))}
          projects={projects}
          active={selection}
          onSelect={(s) => { setSelection(s); setOpenArtifact(null); }}
          onNewProject={() => setShowNewProject(true)}
        />
        {activeProject ? (
          <GroupChat
            project={activeProject}
            agentsById={agentsById}
            onOpenArtifact={setOpenArtifact}
            onPauseToggle={togglePause}
            onMessagePiter={messagePiter}
            onSend={(input) => handleSendToProject(activeProject!.id, input)}
          />
        ) : (
          <ChatThread
            agent={activeAgent}
            onOpenArtifact={setOpenArtifact}
            onSend={(input) => handleSendToAgent(activeAgent.id, input)}
          />
        )}
        <ArtifactPanel artifact={openArtifact} onClose={() => setOpenArtifact(null)} />
        {!openArtifact && !activeProject && (
          <AgentInfo agent={activeAgent} onOpenArtifact={(id) => setOpenArtifact(activeAgent.artifacts[id])} />
        )}
      </div>
      <NewProjectDialog
        open={showNewProject}
        onClose={() => setShowNewProject(false)}
        onCreate={handleNewProject}
      />
    </>
  );
}
