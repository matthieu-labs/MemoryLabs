// Serverless proxy for ElevenLabs Scribe v2 speech-to-text. Keeps
// ELEVENLABS_API_KEY server-side so the hosted app can transcribe without users
// supplying their own key.
//
// The browser POSTs the raw audio bytes as the request body, with the audio
// mime type in Content-Type and the original name in the X-Filename header.
//
// Note: Netlify synchronous functions cap the request body around 6 MB
// (base64-inflated), so this suits short demo clips. Larger files need a
// signed-upload flow.
const ELEVEN_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";

exports.handler = async (event) => {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }

  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return { statusCode: 500, body: JSON.stringify({ error: "ELEVENLABS_API_KEY is not set on the server" }) };
  }

  if (!event.body) {
    return { statusCode: 400, body: JSON.stringify({ error: "Empty request body" }) };
  }

  const headers = event.headers || {};
  const mime = headers["content-type"] || "application/octet-stream";
  const filename = headers["x-filename"] || "audio";
  const buffer = event.isBase64Encoded ? Buffer.from(event.body, "base64") : Buffer.from(event.body);

  try {
    const form = new FormData();
    form.append("file", new Blob([buffer], { type: mime }), filename);
    form.append("model_id", "scribe_v2");
    form.append("diarize", "true");
    form.append("timestamps_granularity", "word");

    const response = await fetch(ELEVEN_STT_URL, {
      method: "POST",
      headers: { "xi-api-key": key },
      body: form,
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
