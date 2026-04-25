export type OnboardingStep = {
  id: string;
  question: string;
  options?: { id: string; label: string }[];
  multi?: boolean;
  freeText?: { placeholder: string };
};

export const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: "industry",
    question: "Bienvenido a Control A. Soy Piter, tu jefe de equipo. Para armarte el equipo correcto, cuéntame qué tipo de negocio tienes.",
    options: [
      { id: "marketing", label: "Agencia de marketing" },
      { id: "ecommerce", label: "E-commerce / DTC" },
      { id: "saas", label: "SaaS / startup" },
      { id: "crypto", label: "Crypto / Web3" },
      { id: "creator", label: "Creador / marca personal" },
      { id: "other", label: "Otro" },
    ],
  },
  {
    id: "stage",
    question: "Listo. ¿En qué etapa estás?",
    options: [
      { id: "idea", label: "Solo una idea — necesito validar" },
      { id: "early", label: "Tracción inicial — primeros clientes" },
      { id: "growing", label: "Creciendo — escalando lo que funciona" },
      { id: "established", label: "Consolidado — optimizando operaciones" },
    ],
  },
  {
    id: "needs",
    question: "¿En qué necesitas más ayuda? Marca todas las que apliquen.",
    multi: true,
    options: [
      { id: "research", label: "Investigación e inteligencia competitiva" },
      { id: "content", label: "Contenido y copy" },
      { id: "design", label: "Diseño y branding" },
      { id: "code", label: "Código y apps web" },
      { id: "video", label: "Video y publicidad" },
      { id: "ops", label: "Operaciones y automatización" },
    ],
  },
  {
    id: "goal",
    question: "Última pregunta: ¿qué quieres lanzar en los próximos 30 días? Cuéntalo en tus palabras.",
    freeText: { placeholder: "Ej: Lanzar el sitio de la agencia, montar calendario de contenido, configurar pipeline de leads..." },
  },
];

export type RecommendedAgent = {
  id: string;
  name: string;
  role: string;
  reason: string;
  accent: string;
  avatar: string;
};

const ROSTERS: Record<string, RecommendedAgent[]> = {
  research: [{ id: "leo", name: "Leo", role: "Analista de Investigación", reason: "Mapeo competitivo e inteligencia de mercado", accent: "from-amber-400 to-orange-500", avatar: "L" }],
  content: [{ id: "maya", name: "Maya", role: "Copywriter", reason: "Copy con voz de marca", accent: "from-rose-400 to-pink-500", avatar: "M" }],
  design: [{ id: "kai", name: "Kai", role: "Diseñador de Marca", reason: "Logos, identidad y creatividad", accent: "from-violet-400 to-fuchsia-500", avatar: "K" }],
  code: [{ id: "nova", name: "Nova", role: "Frontend Engineer", reason: "Apps web premium en Next.js", accent: "from-sky-400 to-indigo-500", avatar: "N" }],
  video: [{ id: "rio", name: "Rio", role: "Editor de Video", reason: "Short-form, ads y reels", accent: "from-cyan-400 to-emerald-500", avatar: "R" }],
  ops: [{ id: "axel", name: "Axel", role: "Ingeniero de Automatización", reason: "Workflows e integraciones", accent: "from-emerald-400 to-teal-500", avatar: "A" }],
};

export function buildRoster(needs: string[]): RecommendedAgent[] {
  const seen = new Set<string>();
  const out: RecommendedAgent[] = [];
  for (const n of needs) for (const a of ROSTERS[n] ?? []) if (!seen.has(a.id)) { seen.add(a.id); out.push(a); }
  return out;
}
