/**
 * LLM dispatch layer.
 * Primary: Hermes USA (single backend, multi-profile). Fallback: Anthropic API direct.
 * Either way, the agent receives the same fully-baked system prompt + injected user context.
 */

type ChatInput = {
  agent_id: string;
  system_prompt: string;
  user_context_block: string;
  message: string;
  history: { role: "user" | "assistant"; content: string }[];
  user_id?: string;
  user_name?: string;
};

type ChatOutput = {
  text: string;
  artifact?: {
    kind: "code" | "preview" | "image" | "video" | "doc" | "dashboard";
    title: string;
    subtitle?: string;
    language?: string;
    content?: string;
    url?: string;
  };
  tool_calls?: { name: string; args: Record<string, any> }[];
};

export async function callAgent(input: ChatInput): Promise<ChatOutput> {
  const hermesUrl = process.env.HERMES_USA_URL;
  if (hermesUrl) return callHermes(hermesUrl, input);
  if (process.env.ANTHROPIC_API_KEY) return callAnthropic(input);
  return mockResponse(input);
}

async function callHermes(baseUrl: string, input: ChatInput): Promise<ChatOutput> {
  // Map app agent IDs to Hermes profile names. Piter = default profile (Hermes core).
  const profile = input.agent_id === "piter" ? "default" : input.agent_id;
  const res = await fetch(`${baseUrl}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(process.env.HERMES_USA_TOKEN ? { Authorization: `Bearer ${process.env.HERMES_USA_TOKEN}` } : {}),
    },
    body: JSON.stringify({
      profile,
      message: input.message,
      user_id: input.user_id,
      user_name: input.user_name,
    }),
  });
  if (!res.ok) throw new Error(`Hermes USA ${res.status}: ${await res.text()}`);
  const data = (await res.json()) as { text?: string; error?: string };
  if (data.error) throw new Error(data.error);
  return { text: data.text ?? "" };
}

async function callAnthropic(input: ChatInput): Promise<ChatOutput> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY!,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: `${input.system_prompt}\n\n${input.user_context_block}`,
      messages: [...input.history, { role: "user", content: input.message }],
    }),
  });
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`);
  const data: any = await res.json();
  return { text: data.content?.[0]?.text ?? "" };
}

function mockResponse(input: ChatInput): ChatOutput {
  return {
    text: `[demo mode — no LLM connected]\n\nAgent: ${input.agent_id}\nReceived: "${input.message}"\n\nWire HERMES_USA_URL or ANTHROPIC_API_KEY in .env.local to make me think.`,
  };
}
