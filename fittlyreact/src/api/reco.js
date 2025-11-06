import { http } from "../lib/http";
import { getAuth } from "../lib/jwt";

export const STYLE_MAP = {
  minimal: "MINIMAL",
  street: "STREET",
  classic: "CLASSIC",
  athleisure: "ATHLEISURE",
};
export const STYLE_KOR = {
  MINIMAL: "미니멀",
  STREET: "스트릿",
  CLASSIC: "클래식",
  ATHLEISURE: "애슬레저",
  MODERN: "모던",
  CASUAL: "캐주얼",
  TECHWEAR: "테크웨어",
};
export const BODY_KOR = {
  SLIM: "슬림",
  NORMAL: "보통",
  MUSCULAR: "근육형",
  CHUBBY: "통통",
  OTHER: "기타",
};

function toAiRequestFromParams({ styles = [], bodyType = "NORMAL", categories, outfitCount = 2 } = {}) {
  return {
    bodyType,
    preferredStyles: styles.map((s) => STYLE_MAP[s] || String(s).toUpperCase()),
    categories: categories?.length ? categories : ["TOP", "BOTTOM", "OUTER", "SHOES"],
    outfitCount,
  };
}

function toItemsFromRecommendResponse(data) {
  const outfits = data?.outfits ?? [];
  const first = outfits[0] ?? {};
  const itemsObj = first.items ?? {};
  return Object.values(itemsObj).map((p, idx) => ({
    id: p?.id ?? idx + 1,
    name: p?.name ?? p?.title ?? "아이템",
    imageUrl: p?.imageUrl ?? p?.image ?? p?.imgUrl ?? p?.thumbnailUrl ?? "",
    price: p?.price ?? null,
    category: p?.categoryCode ?? p?.category ?? "",
  }));
}

function pickMetaFromResponse(data) {
  return {
    bodyType: data?.bodyType ?? null,
    preferredStyles: data?.preferredStyles ?? [],
    categories: data?.categories ?? [],
    generatedAt: data?.generatedAt ?? null,
  };
}

export async function analyzePublic(files) {
  const form = new FormData();
  (files || []).forEach((f) => form.append("files", f));
  const { data } = await http.post("/api/ai/public/analyze", form, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
}

export async function recommendPublic(payload) {
  const { data } = await http.post("/api/ai/public/recommend", payload, {
    headers: { "Content-Type": "application/json" },
  });
  return data;
}

export async function recommendAndSave(payload) {
  const headers = { "Content-Type": "application/json" };
  const { token } = getAuth() ?? {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const { data } = await http.post("/api/ai/recommend", payload, { headers });
  return data;
}

export async function fetchLatestRecommendation() {
  const { data } = await http.get("/api/ai/recommend/latest");
  return data; // RecommendResponse
}

export async function fetchRecoQuestions() {
  return { questions: [] };
}

export async function submitRecoAnswers(answers) {
  try { sessionStorage.setItem("ai_survey_answers", JSON.stringify(answers ?? {})); } catch {}
  return { ok: true };
}

export async function fetchRecommendations({ styles = [], gender, budget } = {}) {
  const req = toAiRequestFromParams({ styles, bodyType: "NORMAL" });
  const data = await recommendPublic(req);
  return { items: toItemsFromRecommendResponse(data), meta: pickMetaFromResponse(data), raw: data };
}

export async function fetchRecommendationsAndSave({ styles = [], gender, budget } = {}) {
  const req = toAiRequestFromParams({ styles, bodyType: "NORMAL" });
  const data = await recommendAndSave(req);
  return { items: toItemsFromRecommendResponse(data), meta: pickMetaFromResponse(data), raw: data };
}
