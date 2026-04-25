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
  // GENERAR
  { id: "generate", label: "Generar imagen", hint: "Texto → imagen", icon: Image, group: "generar",
    prompt: "Quiero generar una imagen. Tipo de calidad: standard. Cuéntame el prompt y te la genero." },
  { id: "generate-premium", label: "Foto premium", hint: "Fotorrealismo comercial", icon: Camera, group: "generar",
    prompt: "Quiero una imagen premium fotorrealista comercial (flux-2-pro). Pasame el prompt." },
  { id: "generate-artistic", label: "Imagen artística", hint: "Conceptual / surreal", icon: Sparkles, group: "generar",
    prompt: "Quiero una imagen artística/conceptual (bytedance-seedream-4.5). Pasame el prompt." },
  { id: "generate-anime", label: "Anime / manga", hint: "Estilo anime", icon: Sparkles, group: "generar",
    prompt: "Quiero una imagen estilo anime/manga (neta-lumina). Pasame el prompt." },

  // EDITAR
  { id: "edit", label: "Editar imagen", hint: "Modificar con instrucción", icon: Pencil, group: "editar",
    prompt: "Quiero editar una imagen. Pasame la URL y describime el cambio." },
  { id: "extend", label: "Extender imagen", hint: "Outpainting", icon: Maximize2, group: "editar",
    prompt: "Quiero extender una imagen hacia un lado. Pasame la URL y dime hacia dónde extenderla." },
  { id: "erase", label: "Borrar objeto", hint: "Eliminar elemento", icon: Eraser, group: "editar",
    prompt: "Quiero borrar un objeto de una imagen. Pasame la URL y dime qué borrar." },
  { id: "remove-bg", label: "Quitar fondo", hint: "Background removal", icon: Scissors, group: "editar",
    prompt: "Quiero quitarle el fondo a una imagen. Pasame la URL." },

  // MEJORAR
  { id: "upscale", label: "Subir resolución", hint: "Upscale 2x/4x", icon: Wand2, group: "mejorar",
    prompt: "Quiero subir la resolución de una imagen. Pasame la URL y dime el escalado (2x o 4x)." },
  { id: "skin", label: "Mejorar piel", hint: "Retoque de retrato", icon: Sparkles, group: "mejorar",
    prompt: "Quiero mejorar la piel de un retrato. Pasame la URL." },

  // PERSONAS
  { id: "character", label: "Personaje consistente", hint: "Mantener referencia", icon: User, group: "personas",
    prompt: "Quiero generar una imagen con un personaje consistente. Pasame la imagen de referencia y el nuevo prompt." },
  { id: "faceswap", label: "Cambiar cara", hint: "Face swap", icon: Repeat, group: "personas",
    prompt: "Quiero hacer un face swap. Pasame la cara fuente y la imagen destino." },
  { id: "outfit", label: "Cambiar outfit", hint: "Vestir distinto", icon: Shirt, group: "personas",
    prompt: "Quiero cambiar el outfit en un retrato. Pasame la URL del retrato y describime el outfit nuevo." },
  { id: "photopack", label: "Photo pack", hint: "Pack desde una selfie", icon: Camera, group: "personas",
    prompt: "Quiero un pack de fotos con un estilo a partir de una selfie. Pasame la selfie y describime el estilo." },

  // PRODUCTO
  { id: "product", label: "Foto de producto", hint: "Producto en escena", icon: Package, group: "producto",
    prompt: "Quiero una foto de producto. Pasame la imagen del producto y describime la escena." },
];

export const GROUP_LABELS: Record<WorkflowGroup, string> = {
  generar: "Generar",
  editar: "Editar",
  mejorar: "Mejorar",
  personas: "Personas",
  producto: "Producto",
};
