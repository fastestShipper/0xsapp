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
    const userMsg: Message = {
      id: uid(),
      authorId: "you",
      text: input.text,
      attachments: input.attachments,
      ts: now(),
      status: "sent",
    };
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, privateMessages: [...a.privateMessages, userMsg] } : a));

    if (!input.text) return;

    // Show typing placeholder
    const typingId = uid();
    setAgents((prev) => prev.map((a) => a.id === agentId ? { ...a, privateMessages: [...a.privateMessages, { id: typingId, authorId: agentId, text: "...", ts: now(), kind: "status" }] } : a));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ agent_id: agentId, message: input.text }),
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
