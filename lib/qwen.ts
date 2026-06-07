import OpenAI from "openai";

// Qwen over any OpenAI-compatible endpoint:
//   • Alibaba DashScope cloud (default)
//   • a LOCAL server — Ollama (http://localhost:11434/v1), vLLM, LM Studio…
// Same SDK; only the baseURL / model / key change via env.
export const hasQwen = Boolean(process.env.DASHSCOPE_API_KEY);

export const qwen = new OpenAI({
  // Local servers don't need a real key; set any non-empty value (e.g. "ollama").
  apiKey: process.env.DASHSCOPE_API_KEY ?? "missing",
  baseURL:
    process.env.DASHSCOPE_BASE_URL ??
    "https://dashscope-intl.aliyuncs.com/compatible-mode/v1",
});

// Model selection.
//   QWEN_MODEL      → use ONE model for every step (typical for local).
//   QWEN_MODEL_WRITE / QWEN_MODEL_REASON → per-step override (cloud tiers).
const SINGLE = process.env.QWEN_MODEL;
export const QWEN_MODELS = {
  write: SINGLE ?? process.env.QWEN_MODEL_WRITE ?? "qwen-max", // final prose
  reason: SINGLE ?? process.env.QWEN_MODEL_REASON ?? "qwen-plus", // summary + structure
} as const;

// Helper: call Qwen and parse a JSON object response.
export async function qwenJSON<T>(
  model: string,
  system: string,
  user: string
): Promise<T> {
  const res = await qwen.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: system },
      { role: "user", content: user },
    ],
  });
  const raw = res.choices[0]?.message?.content ?? "{}";
  return JSON.parse(raw) as T;
}
