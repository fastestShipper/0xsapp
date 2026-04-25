export type ArtifactKind = "code" | "preview" | "image" | "video" | "doc" | "dashboard";

export type Artifact = {
  id: string;
  kind: ArtifactKind;
  title: string;
  subtitle?: string;
  language?: string;
  content?: string;
  url?: string;
  thumbnail?: string;
  producedBy?: string;
};

export type Attachment = {
  id: string;
  kind: "audio" | "file" | "image";
  name: string;
  size?: number;
  url: string;
  durationMs?: number;
  mime?: string;
};

export type Message = {
  id: string;
  authorId: string;
  text?: string;
  ts: string;
  artifactId?: string;
  attachments?: Attachment[];
  status?: "sent" | "delivered" | "read";
  kind?: "message" | "system" | "handoff" | "status";
};

export type Agent = {
  id: string;
  name: string;
  role: string;
  tagline: string;
  avatar: string;
  accent: string;
  online: boolean;
  isConcierge?: boolean;
  lastSeen?: string;
  tools: string[];
  outputs: ArtifactKind[];
  pastProjects?: string[];
  silentNote?: string;
  privateMessages: Message[];
  artifacts: Record<string, Artifact>;
};

export type ProjectStatus = "active" | "paused" | "completed" | "archived";

export type Project = {
  id: string;
  title: string;
  goal: string;
  status: ProjectStatus;
  createdAt: string;
  updatedAt: string;
  participantIds: string[];
  ownerNote?: string;
  unread?: number;
  messages: Message[];
  artifacts: Record<string, Artifact>;
  eta?: string;
};

const codeSnippet = `import { NextResponse } from "next/server";
import { z } from "zod";

const Body = z.object({
  email: z.string().email(),
  plan: z.enum(["starter", "pro", "scale"]),
});

export async function POST(req: Request) {
  const json = await req.json();
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.format() }, { status: 422 });
  }
  const { email, plan } = parsed.data;
  // enviar al pipeline de facturación
  await fetch(process.env.BILLING_HOOK!, {
    method: "POST",
    body: JSON.stringify({ email, plan, ts: Date.now() }),
  });
  return NextResponse.json({ ok: true, queued: true });
}`;

export const PITER: Agent = {
  id: "piter",
  name: "Piter",
  role: "Jefe de Equipo",
  tagline: "Coordino tu equipo y abro los proyectos que necesites.",
  avatar: "P",
  accent: "from-sky-400 via-blue-500 to-blue-600",
  online: true,
  isConcierge: true,
  tools: ["abrir proyectos", "asignar especialistas", "memoria global", "marketplace"],
  outputs: ["doc"],
  privateMessages: [],
  artifacts: {},
};

export const LEO: Agent = {
  id: "leo",
  name: "Leo",
  role: "Analista de Investigación",
  tagline: "Investigación profunda, análisis de competencia, inteligencia de mercado.",
  avatar: "L",
  accent: "from-amber-400 to-orange-500",
  online: true,
  silentNote: "Leo está listo. Escríbele cuando necesites investigación puntual, o espéralo en el próximo proyecto que abras con Piter.",
  tools: ["búsqueda web", "scraping", "síntesis de PDFs", "citas"],
  outputs: ["doc", "dashboard"],
  pastProjects: [],
  privateMessages: [],
  artifacts: {},
};

export const MAYA: Agent = {
  id: "maya",
  name: "Maya",
  role: "Copywriter",
  tagline: "Long-form, ads, copy de landing, con voz de marca.",
  avatar: "M",
  accent: "from-rose-400 to-pink-500",
  online: true,
  silentNote: "Maya está lista. Escríbele en privado si necesitas un copy puntual, o aparecerá cuando Piter abra un proyecto que la requiera.",
  tools: ["perfil de voz", "long-form", "variantes de ads", "copy SEO"],
  outputs: ["doc"],
  pastProjects: [],
  privateMessages: [],
  artifacts: {},
};

export const NOVA: Agent = {
  id: "nova",
  name: "Nova",
  role: "Frontend Engineer",
  tagline: "React/Next.js de producción + UI premium.",
  avatar: "N",
  accent: "from-sky-400 to-indigo-500",
  online: true,
  silentNote: "Nova está lista. Escríbele en privado si necesitas código o un componente puntual, o espérala en el próximo proyecto.",
  tools: ["Next.js", "Tailwind", "shadcn", "Framer Motion", "deploy en Vercel"],
  outputs: ["code", "preview"],
  pastProjects: [],
  privateMessages: [],
  artifacts: {},
};

export const KAI: Agent = {
  id: "kai",
  name: "Kai",
  role: "Diseñador de Marca",
  tagline: "Logos, sistemas de identidad, mockups, creatividad para ads.",
  avatar: "K",
  accent: "from-violet-400 to-fuchsia-500",
  online: false,
  lastSeen: "hace 2 h",
  silentNote: "Kai está disponible. Escríbele en privado para tareas puntuales de diseño.",
  tools: ["export Figma", "generación de imágenes", "sistemas de marca"],
  outputs: ["image"],
  pastProjects: [],
  privateMessages: [],
  artifacts: {},
};

export const RIO: Agent = {
  id: "rio",
  name: "Rio",
  role: "Editor de Video",
  tagline: "Short-form, ads, reels con ritmo de marca.",
  avatar: "R",
  accent: "from-cyan-400 to-emerald-500",
  online: true,
  silentNote: "Rio está listo. Escríbele cuando necesites un corte rápido o espéralo en un proyecto.",
  tools: ["CapCut", "subtítulos automáticos", "sync de música"],
  outputs: ["video"],
  pastProjects: [],
  privateMessages: [],
  artifacts: {},
};

export const AGENTS: Agent[] = [PITER, LEO, MAYA, NOVA, KAI, RIO];
export const SPECIALISTS: Agent[] = AGENTS.filter((a) => !a.isConcierge);

export function getAgent(id: string) {
  return AGENTS.find((a) => a.id === id);
}

export const SAMPLE_PROJECT: Project = {
  id: "proj-landing",
  title: "Landing v1 para la agencia",
  goal: "Lanzar la landing pública de la agencia en 7 días, optimizada para captar auditorías.",
  status: "active",
  createdAt: "Hoy 09:20",
  updatedAt: "Hoy 10:31",
  participantIds: ["piter", "leo", "maya", "nova"],
  unread: 3,
  eta: "Listo aprox. en 38 min",
  messages: [
    { id: "g1", authorId: "piter", text: "Abierto el proyecto Landing v1. Equipo asignado: Leo (research), Maya (copy), Nova (build). Yo coordino. Te aviso cuando hagamos handoff.", ts: "09:20", kind: "system" },
    { id: "g2", authorId: "piter", text: "Leo, empieza con un mapeo competitivo de 12 agencias del mismo nicho. Maya, mientras tanto, define 3 direcciones de tagline. Nova, prepara el scaffold del proyecto en Next.js.", ts: "09:21" },
    { id: "g3", authorId: "leo", text: "Voy. Estimo 25 min para el dashboard inicial.", ts: "09:21", kind: "status" },
    { id: "g4", authorId: "maya", text: "Listo. Te dejo las 3 direcciones cuando estén.", ts: "09:22", kind: "status" },
    { id: "g5", authorId: "nova", text: "Scaffold listo, esperando copy y dirección visual para empezar la landing.", ts: "09:24", kind: "status" },
    { id: "g6", authorId: "leo", text: "Mapeo terminado. Aquí está el dashboard.", ts: "09:34", artifactId: "leo-dash" },
    { id: "g7", authorId: "maya", text: "Direcciones de tagline listas:\n1. Marketing que se paga solo.\n2. No vendemos campañas. Vendemos resultados.\n3. Estrategia primero. Píxeles después.", ts: "10:02" },
    { id: "g8", authorId: "piter", text: "Voto dirección 1 según lo que vimos en research. ¿Lo confirmas o quieres mezclar?", ts: "10:03" },
    { id: "g9", authorId: "maya", text: "Hero copy listo con dirección 1.", ts: "10:14", artifactId: "maya-doc" },
    { id: "g10", authorId: "nova", text: "Recibido. Construyendo preview.", ts: "10:15", kind: "status" },
    { id: "g11", authorId: "nova", text: "Preview listo, falta conectar el form de leads al webhook.", ts: "10:30", artifactId: "nova-preview" },
    { id: "g12", authorId: "nova", text: "API route lista.", ts: "10:31", artifactId: "nova-code" },
    { id: "g13", authorId: "piter", text: "Mirando todo. Falta validar copy con el cliente y deploy. Listo aprox. en 38 min.", ts: "10:31", kind: "status" },
  ],
  artifacts: {
    "leo-dash": { id: "leo-dash", producedBy: "leo", kind: "dashboard", title: "Mapa competitivo — 12 agencias", subtitle: "Precio · Posicionamiento · Canales" },
    "maya-doc": {
      id: "maya-doc", producedBy: "maya", kind: "doc",
      title: "Hero de la landing — v1", subtitle: "Hero · subhead · CTA · social proof",
      content: "# Marketing que se paga solo\n\nArmamos campañas que mueven pipeline, no métricas de vanidad. Un estratega senior y un equipo creativo in-house, listos en días, no trimestres.\n\n— Más de 40 equipos B2B confían en nosotros.\n[Agenda una auditoría de 20 min →]",
    },
    "nova-preview": { id: "nova-preview", producedBy: "nova", kind: "preview", title: "Landing — preview", subtitle: "Preview en vivo · responsive", url: "/preview/landing" },
    "nova-code": { id: "nova-code", producedBy: "nova", kind: "code", title: "app/api/lead/route.ts", subtitle: "Next.js · TypeScript · Zod", language: "ts", content: codeSnippet },
  },
};

export const PROJECTS: Project[] = [];
