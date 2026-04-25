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
import { AGENTS, PITER, SPECIALISTS, PROJECTS, getAgent, type Artifact, type Project } from "@/lib/agents";

export default function Home() {
  const router = useRouter();
  const [selection, setSelection] = useState<Selection>({ kind: "project", id: PROJECTS[0]?.id ?? PITER.id });
  const [openArtifact, setOpenArtifact] = useState<Artifact | null>(null);
  const [projects, setProjects] = useState<Project[]>(PROJECTS);
  const [showNewProject, setShowNewProject] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (localStorage.getItem("controla:onboarded") !== "true") {
      router.replace("/onboarding");
    } else {
      setReady(true);
    }
  }, [router]);

  const agentsById = useMemo(() => Object.fromEntries(AGENTS.map((a) => [a.id, a])), []);

  if (!ready) return null;

  // Auto-fallback if selection points to nothing valid.
  let activeProject: Project | null = null;
  let activeAgent = PITER;
  if (selection.kind === "project") {
    activeProject = projects.find((p) => p.id === selection.id) ?? null;
    if (!activeProject) {
      activeAgent = PITER;
    }
  } else {
    activeAgent = getAgent(selection.id) ?? PITER;
  }

  const handleNewProject = (input: NewProjectInput) => {
    const id = `proj-${Date.now()}`;
    const now = new Date();
    const ts = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
    const newProject: Project = {
      id,
      title: input.goal.length > 60 ? input.goal.slice(0, 57) + "..." : input.goal,
      goal: input.goal,
      status: "active",
      createdAt: `Hoy ${ts}`,
      updatedAt: `Hoy ${ts}`,
      participantIds: input.participantIds,
      eta: "Estimando duracion...",
      messages: [
        { id: `${id}-m1`, authorId: "piter", text: `Abrimos el proyecto. Equipo: ${input.participantIds.filter((x) => x !== "piter").map((x) => agentsById[x]?.name).join(", ")}. Yo coordino.`, ts, kind: "system" },
        { id: `${id}-m2`, authorId: "piter", text: "Arrancando. Voy a definir las primeras tareas para cada uno.", ts },
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
          piter={PITER}
          specialists={SPECIALISTS}
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
          />
        ) : (
          <ChatThread agent={activeAgent} onOpenArtifact={setOpenArtifact} />
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
