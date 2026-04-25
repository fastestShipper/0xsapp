import { getServiceSupabase } from "./supabase";

export type UserContext = {
  user: {
    id: string;
    email: string | null;
    display_name: string | null;
    language: string;
    timezone: string;
  };
  business: Record<string, any>;
  preferences: Record<string, any>;
  roster: { agent_id: string; status: string; hired_at: string }[];
  recent_messages: { agent_id: string; role: string; text: string; created_at: string }[];
  recent_artifacts: { agent_id: string; kind: string; title: string; created_at: string }[];
};

/**
 * Build the per-user context block injected into every agent message.
 * Single source of truth: Postgres. Agents never "remember" anything on their own.
 */
export async function buildUserContext(userId: string, agentId: string): Promise<UserContext> {
  const sb = getServiceSupabase();

  const [{ data: user }, { data: ctx }, { data: roster }, { data: messages }, { data: artifacts }] = await Promise.all([
    sb.from("users").select("*").eq("id", userId).single(),
    sb.from("user_context").select("key,value").eq("user_id", userId),
    sb.from("rosters").select("agent_id,status,hired_at").eq("user_id", userId),
    sb.from("messages")
      .select("agent_id,role,text,created_at")
      .eq("user_id", userId)
      .eq("agent_id", agentId)
      .order("created_at", { ascending: false })
      .limit(20),
    sb.from("artifacts")
      .select("agent_id,kind,title,created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10),
  ]);

  const grouped: Record<string, Record<string, any>> = {};
  for (const row of ctx ?? []) {
    const [namespace, key] = row.key.split(":", 2);
    if (!grouped[namespace]) grouped[namespace] = {};
    grouped[namespace][key ?? "value"] = row.value;
  }

  return {
    user: {
      id: userId,
      email: user?.email ?? null,
      display_name: user?.display_name ?? null,
      language: user?.language ?? "en",
      timezone: user?.timezone ?? "UTC",
    },
    business: grouped.business ?? {},
    preferences: grouped.preferences ?? {},
    roster: roster ?? [],
    recent_messages: (messages ?? []).reverse(),
    recent_artifacts: artifacts ?? [],
  };
}

/** Render the user context as a structured block to inject into the system prompt. */
export function renderContextBlock(ctx: UserContext): string {
  const json = (o: any) => Object.keys(o).length ? JSON.stringify(o, null, 2) : "{}";
  const lines = [
    "=== CURRENT USER CONTEXT ===",
    `id: ${ctx.user.id}`,
    `name: ${ctx.user.display_name ?? "unknown"}`,
    `email: ${ctx.user.email ?? "unknown"}`,
    `language: ${ctx.user.language}`,
    `timezone: ${ctx.user.timezone}`,
    "",
    "BUSINESS:",
    json(ctx.business),
    "",
    "PREFERENCES:",
    json(ctx.preferences),
    "",
    "CURRENT ROSTER:",
    ctx.roster.length
      ? ctx.roster.map((r) => `- ${r.agent_id} (${r.status}, hired ${r.hired_at})`).join("\n")
      : "(empty — user has not hired any specialists yet)",
    "",
    "RECENT ARTIFACTS PRODUCED FOR THIS USER:",
    ctx.recent_artifacts.length
      ? ctx.recent_artifacts.map((a) => `- ${a.agent_id} → ${a.kind}: "${a.title}" (${a.created_at})`).join("\n")
      : "(none yet)",
    "",
    "RECENT MESSAGES (this conversation, oldest → newest):",
    ctx.recent_messages.length
      ? ctx.recent_messages.map((m) => `[${m.role}] ${m.text?.slice(0, 200)}`).join("\n")
      : "(no prior messages — this is the first contact)",
    "=== END USER CONTEXT ===",
  ];
  return lines.join("\n");
}

export async function updateUserContext(userId: string, key: string, value: any) {
  const sb = getServiceSupabase();
  await sb.from("user_context").upsert({ user_id: userId, key, value, updated_at: new Date().toISOString() }, { onConflict: "user_id,key" });
}
