const CHAT_API_URL = import.meta.env.VITE_CHAT_API_URL || "http://localhost:8787/api/chat";
const HEALTH_API_URL = CHAT_API_URL.replace(/\/api\/chat\/?$/, "/health");

function parseSseBuffer(buffer) {
  const frames = buffer.split("\n\n");
  const remainder = frames.pop() || "";
  const events = [];

  for (const frame of frames) {
    const line = frame.split("\n").find((item) => item.startsWith("data:"));
    if (!line) continue;

    const raw = line.slice(5).trim();
    if (!raw || raw === "[DONE]") continue;

    try {
      events.push(JSON.parse(raw));
    } catch {
      events.push({ type: "text", text: raw });
    }
  }

  return { events, remainder };
}

export async function fetchChatHealth() {
  const response = await fetch(HEALTH_API_URL);
  if (!response.ok) {
    throw new Error(`health ${response.status}`);
  }
  return response.json();
}

export async function* streamChat({
  message,
  conversation = [],
  imageUrls = [],
  images = [],
  sessionId = "product-publish-demo",
  model,
  pageDraft,
  draftHistory,
  siteArchives,
  generationBrief,
  clientAction,
  signal,
} = {}) {
  const response = await fetch(CHAT_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      conversation: conversation?.length ? conversation : undefined,
      image_urls: imageUrls,
      images,
      session_id: sessionId,
      model: model || undefined,
      page_draft: pageDraft || undefined,
      draft_history: draftHistory?.length ? draftHistory : undefined,
      site_archives: siteArchives || undefined,
      generation_brief: generationBrief || undefined,
      client_action: clientAction || undefined,
    }),
    signal,
  });

  if (!response.ok || !response.body) {
    const detail = await response.text();
    throw new Error(`${response.status}: ${detail}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const parsed = parseSseBuffer(buffer);
      buffer = parsed.remainder;
      for (const event of parsed.events) yield event;
    }

    buffer += decoder.decode();
    if (buffer.trim()) {
      const parsed = parseSseBuffer(`${buffer}\n\n`);
      for (const event of parsed.events) yield event;
    }
  } finally {
    reader.releaseLock();
  }
}

export { CHAT_API_URL, HEALTH_API_URL };
