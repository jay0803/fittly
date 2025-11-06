import client from "../lib/http";


export async function analyzeImage({ file, imageUrl, question, allowedTags, userContext, categories }) {
  const form = new FormData();
  if (file) form.append("file", file);
  if (!file && imageUrl) form.append("imageUrl", imageUrl);
  if (question) form.append("question", question);
  if (Array.isArray(allowedTags)) form.append("allowedTags", new Blob([JSON.stringify(allowedTags)], { type: "application/json" }));
  if (userContext && typeof userContext === "object") form.append("userContext", new Blob([JSON.stringify(userContext)], { type: "application/json" }));
  if (Array.isArray(categories)) categories.forEach((c) => form.append("categories", c));

  return client.post("/api/ai/public/vision/analyze", form, {
    headers: { "Content-Type": "multipart/form-data" },
    __forceAuth: true, // ✅ 핵심
  });
}


export async function chatVision({ messages, model, allowedTags, userContext }) {
  const body = { messages, model, allowedTags, userContext };
  return client.post("/api/ai/public/vision/chat", body, {
    __forceAuth: true, // ✅ 핵심
  });
}
