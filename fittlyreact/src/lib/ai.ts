import { http } from "./http";

export type CategoryCode = "TOP" | "BOTTOM" | "OUTER" | "SHOES";
export type StyleCode = "TECHWEAR" | "ATHLEISURE" | (string & {});
export interface RecommendItem {
  id: number;
  brand?: string;
  name: string;
  price: number;
  discountPrice?: number | null;
  thumbnailUrl?: string | null;
  categoryCode: CategoryCode;
}

export interface Outfit {
  category: CategoryCode;
  items: RecommendItem[];
  totalPrice?: number;
}

export interface RecommendResponse {
  generatedAt: string;
  outfits: Outfit[];
}

function normalizeRecommendResponse(res: any): RecommendResponse {
  const data = res?.data ?? res ?? {};
  const outfitsRaw = Array.isArray(data.outfits) ? data.outfits : [];

  const outfits: Outfit[] = outfitsRaw.map((o: any) => {
    const category = (o.category ?? o.categoryCode) as CategoryCode;
    const items = Array.isArray(o.items) ? o.items : [];
    const mappedItems: RecommendItem[] = items.map((it: any) => ({
      id: it.id,
      brand: it.brand,
      name: it.name ?? it.title,
      price: typeof it.price === "number" ? it.price : (it.price ?? 0),
      discountPrice: it.discountPrice ?? it.discount_price ?? null,
      thumbnailUrl:
        it.thumbnailUrl ?? it.thumbnail_url ?? it.imageUrl ?? it.image_url ?? null,
      categoryCode: (it.categoryCode ?? it.category_code ?? category) as CategoryCode,
    }));
    return {
      category,
      items: mappedItems,
      totalPrice: o.totalPrice ?? o.total_price,
    };
  });

  return {
    generatedAt: data.generatedAt ?? new Date().toISOString(),
    outfits,
  };
}

export type VisionChatMessage = {
  role: "system" | "user" | "assistant";
  text?: string;
  imageData?: string;
};

export async function analyzeImage(args: {
  file: File;
  question?: string;
  categories?: string[];
}): Promise<any> {
  const fd = new FormData();
  fd.append("file", args.file);
  if (args.question) fd.append("question", args.question);
  (args.categories ?? []).forEach((c) => fd.append("categories", c));

  return http.post("/api/ai/public/vision/analyze", fd, {
    suppress401AutoLogout: true,
  } as any);
}

export async function chatVision(args: {
  messages: VisionChatMessage[];
}): Promise<any> {
  return http.post("/api/ai/public/vision/chat", args, {
    suppress401AutoLogout: true,
  } as any);
}

export async function analyze(files: File[]) {
  const first = (files || [])[0];
  if (!first) {
    throw new Error("분석할 이미지 파일이 없습니다.");
  }
  return analyzeImage({ file: first });
}

export async function recommend(payload: {
  bodyType?: string | null;
  preferredStyles?: StyleCode[];
  categories?: CategoryCode[];
  outfitCount?: number;
  maxItemsPerCategory?: number;
}): Promise<RecommendResponse> {
  const SUPPRESS_401_CFG = { suppress401AutoLogout: true } as any;

  try {
    const res = await http.post("/api/ai/recommend", payload, SUPPRESS_401_CFG);
    return normalizeRecommendResponse(res);
  } catch (e: any) {
    const s = e?.response?.status;
    if (s === 401 || s === 403) {
      const res2 = await http.post("/api/ai/public/recommend", payload, SUPPRESS_401_CFG);
      return normalizeRecommendResponse(res2);
    }
    throw e;
  }
}
