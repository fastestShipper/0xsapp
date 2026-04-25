import { NextResponse } from "next/server";

const XAI_STT_KEY = process.env.XAI_STT_KEY ?? process.env.XAI_API_KEY ?? "";
const GEMINI_KEY = process.env.GEMINI_API_KEY ?? process.env.GOOGLE_API_KEY ?? "";
const GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"];

const EXT_MIME: Record<string, string> = {
  webm: "audio/webm",
  ogg: "audio/ogg",
  mp3: "audio/mpeg",
  mpeg: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  mp4: "audio/mp4",
  aac: "audio/aac",
  flac: "audio/flac",
};

async function tryXai(url: string, buf: Buffer, mime: string, ext: string): Promise<{ text: string } | { error: string; retry: boolean }> {
  if (!XAI_STT_KEY) return { error: "no xai key", retry: true };
  try {
    const fd = new FormData();
    fd.append("model_id", "scribe_v2");
    fd.append("file", new Blob([new Uint8Array(buf)], { type: mime }), `recording.${ext || "webm"}`);
    const res = await fetch("https://api.x.ai/v1/stt", {
      method: "POST",
      headers: { Authorization: `Bearer ${XAI_STT_KEY}` },
      body: fd,
    });
    if (!res.ok) {
      const t = await res.text();
      return { error: `xai ${res.status}: ${t.slice(0, 160)}`, retry: true };
    }
    const data: any = await res.json();
    return { text: (data.text ?? "").trim() };
  } catch (e: any) {
    return { error: e?.message ?? "xai network error", retry: true };
  }
}

async function tryGemini(buf: Buffer, mime: string): Promise<{ text: string; model: string } | { error: string }> {
  if (!GEMINI_KEY) return { error: "no gemini key" };
  const b64 = buf.toString("base64");
  let lastErr = "";
  for (const model of GEMINI_MODELS) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: "Transcribe este audio al idioma original. Solo devuelve el texto transcrito, sin comillas, sin metadata, sin etiquetas." },
              { inline_data: { mime_type: mime, data: b64 } },
            ],
          }],
        }),
      }
    );
    if (res.ok) {
      const data: any = await res.json();
      return { text: (data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "").trim(), model };
    }
    lastErr = `${model} ${res.status}`;
    if (res.status === 503 || res.status === 429) continue;
    return { error: `gemini ${lastErr}` };
  }
  return { error: `gemini overloaded: ${lastErr}` };
}

export async function POST(req: Request) {
  let body: { url?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  if (!body.url) return NextResponse.json({ error: "missing url" }, { status: 400 });

  try {
    const audioRes = await fetch(body.url);
    if (!audioRes.ok) throw new Error(`fetch audio ${audioRes.status}`);
    const audioBuf = Buffer.from(await audioRes.arrayBuffer());
    const ext = (body.url.split(".").pop() ?? "").toLowerCase().split("?")[0];
    const headerMime = audioRes.headers.get("content-type") ?? "";
    const mime = EXT_MIME[ext] ?? (headerMime.startsWith("audio/") ? headerMime : "audio/webm");

    // Primary: xAI scribe_v2.
    const xai = await tryXai(body.url, audioBuf, mime, ext);
    if ("text" in xai) return NextResponse.json({ text: xai.text, provider: "xai" });

    // Fallback: Gemini.
    const gem = await tryGemini(audioBuf, mime);
    if ("text" in gem) return NextResponse.json({ text: gem.text, provider: "gemini", model: gem.model });

    return NextResponse.json({ error: `xai: ${xai.error} | gemini: ${"error" in gem ? gem.error : "?"}` }, { status: 502 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? "transcribe failed" }, { status: 500 });
  }
}
