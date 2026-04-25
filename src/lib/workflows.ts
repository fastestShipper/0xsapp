import {
  Image, Pencil, Maximize2, Eraser, Scissors,
  Wand2, Sparkles, User, Repeat, Shirt, Camera, Package,
  type LucideIcon,
} from "lucide-react";

export type WorkflowGroup = "generar" | "editar" | "mejorar" | "personas" | "producto";

export type Workflow = {
  id: string;
  label: string;
  hint: string;
  icon: LucideIcon;
  group: WorkflowGroup;
  prompt: string;
};

export const WORKFLOWS: Workflow[] = [
  // GENERAR — natural user phrasing, Piter handles the intake.
  { id: "generate", label: "Generar imagen", hint: "Texto → imagen", icon: Image, group: "generar",
    prompt: "Quiero generar una imagen." },
  { id: "generate-premium", label: "Foto premium", hint: "Fotorrealismo comercial", icon: Camera, group: "generar",
    prompt: "Quiero una foto premium fotorrealista." },
  { id: "generate-artistic", label: "Imagen artística", hint: "Conceptual / surreal", icon: Sparkles, group: "generar",
    prompt: "Quiero una imagen artística o conceptual." },
  { id: "generate-anime", label: "Anime / manga", hint: "Estilo anime", icon: Sparkles, group: "generar",
    prompt: "Quiero una imagen estilo anime." },

  // EDITAR
  { id: "edit", label: "Editar imagen", hint: "Modificar con instrucción", icon: Pencil, group: "editar",
    prompt: "Quiero editar una imagen." },
  { id: "extend", label: "Extender imagen", hint: "Outpainting", icon: Maximize2, group: "editar",
    prompt: "Quiero extender una imagen." },
  { id: "erase", label: "Borrar objeto", hint: "Eliminar elemento", icon: Eraser, group: "editar",
    prompt: "Quiero borrar un objeto de una imagen." },
  { id: "remove-bg", label: "Quitar fondo", hint: "Background removal", icon: Scissors, group: "editar",
    prompt: "Quiero quitarle el fondo a una imagen." },

  // MEJORAR
  { id: "upscale", label: "Subir resolución", hint: "Upscale 2x/4x", icon: Wand2, group: "mejorar",
    prompt: "Quiero subir la resolución de una imagen." },
  { id: "skin", label: "Mejorar piel", hint: "Retoque de retrato", icon: Sparkles, group: "mejorar",
    prompt: "Quiero mejorar la piel de un retrato." },

  // PERSONAS
  { id: "character", label: "Personaje consistente", hint: "Mantener referencia", icon: User, group: "personas",
    prompt: "Quiero generar una imagen manteniendo el mismo personaje." },
  { id: "faceswap", label: "Cambiar cara", hint: "Face swap", icon: Repeat, group: "personas",
    prompt: "Quiero hacer un face swap." },
  { id: "outfit", label: "Cambiar outfit", hint: "Vestir distinto", icon: Shirt, group: "personas",
    prompt: "Quiero cambiar el outfit de una persona en una foto." },
  { id: "photopack", label: "Photo pack", hint: "Pack desde una selfie", icon: Camera, group: "personas",
    prompt: "Quiero un pack de fotos con estilo a partir de una selfie." },

  // PRODUCTO
  { id: "product", label: "Foto de producto", hint: "Producto en escena", icon: Package, group: "producto",
    prompt: "Quiero una foto de producto." },
];

export const GROUP_LABELS: Record<WorkflowGroup, string> = {
  generar: "Generar",
  editar: "Editar",
  mejorar: "Mejorar",
  personas: "Personas",
  producto: "Producto",
};
