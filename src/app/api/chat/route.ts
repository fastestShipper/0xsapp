import { NextResponse } from "next/server";
import { getServerSupabase, getServiceSupabase, isDemoMode } from "@/lib/server/supabase";
import { buildUserContext, renderContextBlock } from "@/lib/server/user-context";
import { callAgent } from "@/lib/server/llm";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body?.agent_id || typeof body.message !== "string") {
    return NextResponse.json({ error: "agent_id and message required" }, { status: 400 });
  }

  // If Hermes bridge is available, talk to it directly without Supabase.
  if (process.env.HERMES_USA_URL) {
    try {
      const out = await callAgent({
        agent_id: body.agent_id,
        system_prompt: "",
        user_context_block: "",
        message: body.message,
        history: [],
      });
      return NextResponse.json({ text: out.text });
    } catch (err: any) {
      return NextResponse.json({ error: err?.message ?? "hermes error" }, { status: 502 });
    }
  }

  if (isDemoMode()) {
    return NextResponse.json({
      text: `[demo mode] You said: "${body.message}". Configure Supabase + Hermes to enable real chat.`,
    });
  }

  const supabase = await getServerSupabase();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const service = getServiceSupabase();

  const { data: agent, error: agentErr } = await service
    .from("agents")
    .select("id,system_prompt,name")
    .eq("id", body.agent_id)
    .single();
  if (agentErr || !agent) return NextResponse.json({ error: "agent not found" }, { status: 404 });

  const ctx = await buildUserContext(user.id, agent.id);
  const contextBlock = renderContextBlock(ctx);

  const history = ctx.recent_messages
    .filter((m) => m.role === "user" || m.role === "agent")
    .map((m) => ({ role: (m.role === "agent" ? "assistant" : "user") as "user" | "assistant", content: m.text ?? "" }));

  await service.from("messages").insert({
    user_id: user.id,
    agent_id: agent.id,
    role: "user",
    text: body.message,
  });

  const out = await callAgent({
    agent_id: agent.id,
    system_prompt: agent.system_prompt,
    user_context_block: contextBlock,
    message: body.message,
    history,
  });

  let artifactId: string | null = null;
  if (out.artifact) {
    const { data: art } = await service.from("artifacts").insert({
      user_id: user.id,
      agent_id: agent.id,
      kind: out.artifact.kind,
      title: out.artifact.title,
      subtitle: out.artifact.subtitle,
      language: out.artifact.language,
      content: out.artifact.content,
      url: out.artifact.url,
    }).select("id").single();
    artifactId = art?.id ?? null;
  }

  await service.from("messages").insert({
    user_id: user.id,
    agent_id: agent.id,
    role: "agent",
    text: out.text,
    artifact_id: artifactId,
  });

  return NextResponse.json({
    text: out.text,
    artifact: out.artifact ? { id: artifactId, ...out.artifact } : null,
    tool_calls: out.tool_calls ?? [],
  });
}
