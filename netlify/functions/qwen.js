// Serverless proxy for Qwen (DashScope). Keeps QWEN_API_KEY server-side so the
// hosted app works without users supplying their own key.
const QWEN_URL = "https://dashscope-intl.aliyuncs.com/compatible-mode/v1/chat/completions";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const key = process.env.QWEN_API_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: "QWEN_API_KEY is not set on the server" }) };
  }

  let payload;
  try {
    payload = JSON.parse(event.body || "{}");
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid JSON body" }) };
  }

  const { messages, temperature = 0.7, model = "qwen3.6-max-preview" } = payload;
  if (!Array.isArray(messages) || !messages.length) {
    return { statusCode: 400, body: JSON.stringify({ error: "messages[] is required" }) };
  }

  try {
    const response = await fetch(QWEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({ model, messages, temperature }),
    });
    const body = await response.text();
    return {
      statusCode: response.status,
      headers: { "Content-Type": "application/json" },
      body,
    };
  } catch (error) {
    return { statusCode: 502, body: JSON.stringify({ error: `Upstream request failed: ${error.message}` }) };
  }
};
