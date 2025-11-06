import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import "../css/AdminProductPage.css";
import "../css/admin.css";
import "../css/responsive.css";
import { getAuth } from "../lib/jwt";

const CATEGORIES = [
  { code: "TOP", label: "상의" },
  { code: "BOTTOM", label: "하의" },
  { code: "OUTER", label: "아우터" },
  { code: "SHOES", label: "신발" },
];
const STATUSES = ["", "SALE"];
const SIZE_PRESETS = {
  DEFAULT: [],
  TOP: [],
  BOTTOM: [],
  OUTER: [],
  SHOES: [],
};

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const toNum = (v) => (v === "" || v === null || v === undefined ? NaN : Number(v));
const fmtKRW = (n) => (Number.isFinite(n) ? n.toLocaleString("ko-KR") + "원" : "-원");
const parseCSV = (text) => (text || "").split(/[\n,]/g).map((s) => s.trim()).filter(Boolean);
const SIZE_ORDER = ["XXS", "XS", "S", "M", "L", "XL", "XXL", "XXXL", "FREE", "ONE"];
const normalize = (s) => String(s || "").toUpperCase();
const sizeSortKey = (s) => {
  const up = normalize(s);
  const idx = SIZE_ORDER.indexOf(up);
  if (idx >= 0) return idx;
  const num = Number(up);
  return Number.isFinite(num) ? 1000 + num : 2000 + up.charCodeAt(0);
};

const sanitizeSizes = (arr) =>
  (Array.isArray(arr) ? arr : [])
    .map((s) => ({ size: String(s?.size ?? "").trim(), stock: Number(s?.stock ?? 0) || 0 }))
    .filter((s) => s.size !== "" && s.stock >= 0);

const presetRows = (code) => {
  const key = String(code || "").toUpperCase();
  const base = SIZE_PRESETS[key] || SIZE_PRESETS.DEFAULT;
  return base.map((sz) => ({ size: sz, stock: 0 }));
};

export default function AdminProductPage() {
  const [form, setForm] = useState({
    name: "", brand: "", category: "",
    price: "", discountPrice: "", discountPercent: "",
    status: "SALE",
    description: "", material: "",
    color: "",
    styleCode: "", videoUrl: "", tagsText: "", releaseDate: ""
  });

  const [colors, setColors] = useState(
    parseCSV(form.color).length ? parseCSV(form.color) : ["#000000"]
  );
  const [colorNames, setColorNames] = useState(colors.map(() => ""));
  const [colorSizes, setColorSizes] = useState(
    colors.map((c) => ({ color: c, sizes: presetRows(form.category) }))
  );

  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);
  const fileIdentity = (f) => `${f.name}__${f.size}__${f.lastModified}`;
  const addImages = (filesLike) => {
    const picked = Array.from(filesLike || []);
    setImageFiles((prev) => {
      const map = new Map(prev.map((f) => [fileIdentity(f), f]));
      picked.forEach((f) => map.set(fileIdentity(f), f));
      return Array.from(map.values());
    });
  };
  const removeImageAt = (idx) => setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  const [submitting, setSubmitting] = useState(false);
  const [lastEdited, setLastEdited] = useState(null);
  const tags = useMemo(() => parseCSV(form.tagsText), [form.tagsText]);
  const calcDiscountPriceFromPercent = (priceNum, percentNum) => {
    if (!Number.isFinite(priceNum) || priceNum <= 0) return "";
    if (!Number.isFinite(percentNum)) return "";
    const p = clamp(percentNum, 0, 100);
    return String(Math.round(priceNum * (1 - p / 100)));
  };
  const calcPercentFromDiscountPrice = (priceNum, discountPriceNum) => {
    if (!Number.isFinite(priceNum) || priceNum <= 0) return "";
    if (!Number.isFinite(discountPriceNum)) return "";
    const percent = Math.round((1 - discountPriceNum / priceNum) * 100);
    return String(clamp(percent, 0, 100));
  };

  const setField = (name, value) => setForm((p) => ({ ...p, [name]: value }));
  const onChangePrice = (e) => {
    const value = e.target.value;
    setField("price", value);
    setLastEdited("price");
    const priceNum = toNum(value);
    const dpNum = toNum(form.discountPrice);
    const perNum = toNum(form.discountPercent);
    if (lastEdited === "discountPercent" && Number.isFinite(perNum)) {
      setField("discountPrice", calcDiscountPriceFromPercent(priceNum, perNum));
    } else if (lastEdited === "discountPrice" && Number.isFinite(dpNum)) {
      setField("discountPercent", calcPercentFromDiscountPrice(priceNum, dpNum));
    }
  };
  const onChangeDiscountPercent = (e) => {
    const num = toNum(e.target.value);
    setLastEdited("discountPercent");
    setField("discountPercent", Number.isFinite(num) ? String(clamp(num, 0, 100)) : "");
    const priceNum = toNum(form.price);
    if (Number.isFinite(priceNum) && Number.isFinite(num)) {
      setField("discountPrice", calcDiscountPriceFromPercent(priceNum, num));
    }
  };
  const onChangeDiscountPrice = (e) => {
    const dpNum = toNum(e.target.value);
    setLastEdited("discountPrice");
    const priceNum = toNum(form.price);
    const safe = Number.isFinite(dpNum) && Number.isFinite(priceNum) ? clamp(dpNum, 0, priceNum) : dpNum;
    setField("discountPrice", String(safe));
    if (Number.isFinite(priceNum) && Number.isFinite(dpNum)) {
      setField("discountPercent", calcPercentFromDiscountPrice(priceNum, dpNum));
    }
  };

  const addColor = () => {
    setColors((arr) => [...arr, "#cccccc"]);
    setColorNames((arr) => [...arr, ""]);
  };
  const removeColor = (idx) => {
    setColors((arr) => arr.filter((_, i) => i !== idx));
    setColorNames((arr) => arr.filter((_, i) => i !== idx));
  };
  const changeColor = (idx, value) =>
    setColors((arr) => arr.map((c, i) => (i === idx ? value : c)));
  const changeColorName = (idx, value) =>
    setColorNames((arr) => arr.map((c, i) => (i === idx ? value : c)));

  useEffect(() => {
    setColorSizes((prev) => {
      const baseRows = presetRows(form.category);
      const next = (colors || []).map((col, idx) => {
        const prevRow = prev?.[idx];
        const sizes = sanitizeSizes(prevRow?.sizes).length
          ? sanitizeSizes(prevRow.sizes)
          : baseRows.map((r) => ({ ...r }));
        return { color: col, sizes };
      });
      return next;
    });
    setColorNames((prev) => {
      const next = [...prev];
      if (colors.length > next.length) {
        while (next.length < colors.length) next.push("");
      } else if (colors.length < next.length) {
        next.length = colors.length;
      }
      return next;
    });
  }, [colors, form.category]);

  useEffect(() => {
    if (!form.category) return;
    const rows = presetRows(form.category);
    setColorSizes((prev) =>
      prev.map((v) => ({ ...v, sizes: rows.map((r) => ({ ...r })) }))
    );
  }, [form.category]);

  const allSizes = useMemo(() => {
    const set = new Set();
    colorSizes.forEach((v) => v.sizes.forEach((s) => set.add(String(s.size).trim())));
    return Array.from(set).filter(Boolean).sort((a, b) => sizeSortKey(a) - sizeSortKey(b));
  }, [colorSizes]);

  const getStock = (colorIdx, size) => {
    const v = colorSizes[colorIdx];
    const idx = v.sizes.findIndex((s) => String(s.size).trim() === String(size).trim());
    return idx >= 0 ? v.sizes[idx].stock : "";
  };
  const setStock = (colorIdx, size, value) => {
    setColorSizes((list) =>
      list.map((v, i) => {
        if (i !== colorIdx) return v;
        const idx = v.sizes.findIndex((s) => String(s.size).trim() === String(size).trim());
        if (idx >= 0) {
          const next = [...v.sizes];
          next[idx] = { ...next[idx], stock: value };
          return { ...v, sizes: next };
        }
        return { ...v, sizes: [...v.sizes, { size, stock: value }] };
      })
    );
  };

  const [newSize, setNewSize] = useState("");
  const quickAddSizes = useMemo(() => {
    const cat = String(form.category || "").toUpperCase();
    switch (cat) {
      case "SHOES":
        return ["240", "250", "260", "270", "280"];
      case "BOTTOM":
        return ["24", "26", "28", "30", "FREE"];
      case "TOP":
      case "OUTER":
      default:
        return ["S", "M", "L", "XL", "FREE"];
    }
  }, [form.category]);

  const ensureSizeColumn = (size) => {
    const s = String(size).trim();
    if (!s) return;
    if (allSizes.includes(s)) return;
    setColorSizes((list) =>
      list.map((v) => ({ ...v, sizes: [...v.sizes, { size: s, stock: 0 }] }))
    );
  };

  const removeSizeColumn = (size) => {
    const s = String(size).trim();
    if (!s) return;
    setColorSizes((list) =>
      list.map((v) => ({ ...v, sizes: v.sizes.filter((x) => String(x.size).trim() !== s) }))
    );
  };

  const validate = () => {
    if (!form.name.trim()) return "상품명을 입력하세요.";
    if (!form.brand.trim()) return "브랜드를 입력하세요.";
    if (!form.category.trim()) return "카테고리를 선택하세요.";

    const priceNum = toNum(form.price);
    if (!Number.isFinite(priceNum) || priceNum < 0) return "가격을 올바르게 입력하세요.";

    if (!colors.length || colors.some((c) => !/^#/.test(c))) return "색상을 올바르게 선택하세요.";

    for (const v of colorSizes) {
      if (!v.sizes.length) return `색상 ${v.color}의 사이즈를 1개 이상 입력하세요.`;
      for (const s of v.sizes) {
        if (!String(s.size).trim()) return `색상 ${v.color}에 빈 사이즈가 있습니다.`;
        const st = toNum(s.stock);
        if (!Number.isFinite(st) || st < 0) return `색상 ${v.color}의 재고는 0 이상이어야 합니다.`;
      }
    }

    const priceNum2 = toNum(form.price);
    const dp = toNum(form.discountPrice);
    const per = toNum(form.discountPercent);
    if (form.discountPrice !== "" && (!Number.isFinite(dp) || dp < 0 || dp > priceNum2))
      return "할인가는 0 이상이며 가격 이하여야 합니다.";
    if (form.discountPercent !== "" && (!Number.isFinite(per) || per < 0 || per > 100))
      return "할인율은 0~100 사이여야 합니다.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    const { token } = getAuth();

    const priceNum = toNum(form.price);
    let discountPriceNum = null;
    if (form.discountPrice !== "") {
      discountPriceNum = clamp(toNum(form.discountPrice), 0, priceNum);
    } else if (form.discountPercent !== "") {
      const per = clamp(toNum(form.discountPercent), 0, 100);
      discountPriceNum = Math.round(priceNum * (1 - per / 100));
    }

    const flatSizeMap = new Map();
    colorSizes.forEach((v) => v.sizes.forEach((s) => {
      const key = String(s.size).trim();
      const prev = flatSizeMap.get(key) || 0;
      flatSizeMap.set(key, prev + (Number(s.stock) || 0));
    }));
    const flatSizes = Array.from(flatSizeMap.entries()).map(([size, stock]) => ({ size, stock }));

    const fd = new FormData();
    const data = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      category: form.category.trim(),
      price: priceNum,
      discountPrice: discountPriceNum === null ? null : discountPriceNum,
      status: form.status,
      description: form.description.trim() || null,
      material: form.material.trim() || null,
      color: colors.join(","), // CSV
      styleCode: form.styleCode.trim() || null,
      videoUrl: form.videoUrl.trim() || null,
      tags: parseCSV(form.tagsText).join(","),
      releaseDate: form.releaseDate ? new Date(form.releaseDate).toISOString().slice(0, 19) : null,

      sizes: flatSizes,

      colorSizes: colorSizes.map((v, idx) => ({
        color: v.color,
        colorName: colorNames[idx] || "",
        sizes: sanitizeSizes(v.sizes).map((s) => ({ size: s.size, stock: Number(s.stock) || 0 })),
      })),
    };
    fd.append("data", new Blob([JSON.stringify(data)], { type: "application/json" }));
    if (thumbnailFile) fd.append("thumbnail", thumbnailFile);
    imageFiles.forEach((f) => fd.append("images", f));

    setSubmitting(true);
    try {
      await axios.post("/api/admin/products", fd, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      });
      alert("상품이 등록되었습니다.");

      setForm({
        name: "", brand: "", category: "",
        price: "", discountPrice: "", discountPercent: "",
        status: "SALE", description: "", material: "",
        color: "", styleCode: "", videoUrl: "", tagsText: "", releaseDate: ""
      });
      setColors(["#000000"]);
      setColorNames([""]);
      setColorSizes([{ color: "#000000", sizes: presetRows("") }]);
      setThumbnailFile(null); setImageFiles([]); setLastEdited(null); setNewSize("");
    } catch (error) {
      console.error(error);
      const msg = error?.response?.data?.message || error?.message || "상품 등록 실패";
      alert(`요청 실패${error?.response?.status ? ` (${error.response.status})` : ""}\n${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  const thumbPreview = thumbnailFile ? URL.createObjectURL(thumbnailFile) : null;
  const imagePreviews = imageFiles.map((f) => ({ name: f.name, url: URL.createObjectURL(f) }));
  const priceNum = toNum(form.price);
  const dpNum = toNum(form.discountPrice);
  const perNum = toNum(form.discountPercent);
  const effectiveDp =
    form.discountPrice !== ""
      ? (Number.isFinite(dpNum) ? dpNum : NaN)
      : form.discountPercent !== ""
        ? (Number.isFinite(perNum) && Number.isFinite(priceNum)
          ? Math.round(priceNum * (1 - clamp(perNum, 0, 100) / 100))
          : NaN)
        : NaN;
  const effectivePer =
    form.discountPercent !== ""
      ? (Number.isFinite(perNum) ? clamp(perNum, 0, 100) : NaN)
      : form.discountPrice !== ""
        ? (Number.isFinite(priceNum) && Number.isFinite(dpNum) && priceNum > 0
          ? clamp(Math.round((1 - dpNum / priceNum) * 100), 0, 100)
          : NaN)
        : NaN;

  return (
    <div className="container admin-wrap">
      <header className="admin-header">
        <h1>관리자 상품 등록</h1>
        <p className="admin-desc">
          퍼센트 자동 계산 + <b>색상별 사이즈/재고(카테고리별 프리셋)</b>
        </p>
      </header>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="row">
          <label className="label" htmlFor="name">상품명</label>
          <input id="name" className="input" value={form.name} onChange={(e) => setField("name", e.target.value)} required />
        </div>

        <div className="row">
          <label className="label" htmlFor="brand">브랜드</label>
          <input id="brand" className="input" value={form.brand} onChange={(e) => setField("brand", e.target.value)} required />
        </div>

        <div className="row">
          <label className="label" htmlFor="category">카테고리</label>
          <select
            id="category"
            className="select"
            value={form.category}
            onChange={(e) => setField("category", e.target.value)}
            required
          >
            <option value="">선택하세요</option>
            {CATEGORIES.map((c) => (
              <option key={c.code} value={c.code}>{c.label}</option>
            ))}
          </select>
        </div>

        <div className="row">
          <label className="label" htmlFor="status">상태</label>
          <select id="status" className="select" value={form.status} onChange={(e) => setField("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="row">
          <label className="label" htmlFor="price">정가</label>
          <input id="price" type="number" min="0" className="input" value={form.price} onChange={onChangePrice} placeholder="예) 89000" required />
          <small className="muted">현재 계산된 할인가: <b>{fmtKRW(effectiveDp)}</b></small>
        </div>
        <div className="row">
          <label className="label" htmlFor="discountPercent">할인율(%)</label>
          <input id="discountPercent" type="number" min="0" max="100" className="input" value={form.discountPercent} onChange={onChangeDiscountPercent} placeholder="예) 20" />
        </div>
        <div className="row">
          <label className="label" htmlFor="discountPrice">할인가(원)</label>
          <input id="discountPrice" type="number" min="0" className="input" value={form.discountPrice} onChange={onChangeDiscountPrice} placeholder="예) 69000" />
          <small className="muted">현재 계산된 할인율: <b>{Number.isFinite(effectivePer) ? `${effectivePer}%` : "-"}</b></small>
        </div>

        <div className="row">
          <label className="label" htmlFor="material">소재</label>
          <input id="material" className="input" value={form.material} onChange={(e) => setField("material", e.target.value)} />
        </div>

        <div className="row row--full">
          <label className="label">색상(여러 개)</label>

          <div className="swatches swatches--bar" aria-label="선택된 색상 미리보기">
            {colors.map((c, i) => (
              <span key={i} className="swatch" title={c} style={{ background: c }} />
            ))}
          </div>

          <div className="colors-grid">
            {colors.map((c, idx) => (
              <div className="color-row" key={idx}>
                <input
                  type="color"
                  className="input color-input"
                  value={c}
                  onChange={(e) => changeColor(idx, e.target.value)}
                  aria-label={`색상-${idx + 1}`}
                />
                <input
                  className="input hex-input"
                  value={c}
                  onChange={(e) => changeColor(idx, e.target.value)}
                  placeholder="#000000"
                />
                <input
                  className="input"
                  value={colorNames[idx] || ""}
                  onChange={(e) => changeColorName(idx, e.target.value)}
                  placeholder="컬러 이름 (예: 블랙 / 차콜 / 베이지)"
                  aria-label={`색상-${idx + 1} 이름`}
                />
                <button
                  type="button"
                  className="btn btn--ghost btn--remove"
                  onClick={() => removeColor(idx)}
                >
                  삭제
                </button>
              </div>
            ))}
          </div>

          <div className="actions actions--left">
            <button type="button" className="btn btn--ghost" onClick={addColor}>색상 추가</button>
          </div>
        </div>

        <div className="row row--full">
          <label className="label">색상별 사이즈/재고</label>

          <div className="variant-table-wrap">
            <table className="variant-table">
              <thead>
                <tr>
                  <th className="sticky-left">색상</th>
                  {allSizes.map((sz) => (
                    <th key={sz}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center" }}>
                        <span>{sz}</span>
                        <button
                          type="button"
                          title={`${sz} 열 제거`}
                          aria-label={`${sz} 열 제거`}
                          onClick={() => removeSizeColumn(sz)}
                          style={{
                            border: "none", background: "transparent",
                            cursor: "pointer", fontSize: 14, lineHeight: 1
                          }}
                        >
                          ×
                        </button>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colorSizes.map((v, cIdx) => (
                  <tr key={cIdx}>
                    <td className="sticky-left">
                      <div className="color-cell">
                        <span className="swatch swatch--lg" style={{ background: v.color }} title={v.color} />
                        {colorNames[cIdx] && <span className="color-name">({colorNames[cIdx]})</span>}
                      </div>
                    </td>
                    {allSizes.map((sz) => (
                      <td key={sz}>
                        <input
                          className="input stock-input stock-cell"
                          type="number" min="0"
                          value={getStock(cIdx, sz)}
                          onChange={(e) => setStock(cIdx, sz, e.target.value)}
                          aria-label={`색상 ${v.color} - ${sz} 재고`}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="variant-toolbar">
              <span className="muted">빠른 사이즈 열 추가:</span>
              {quickAddSizes.map((s) => (
                <button key={s} type="button" className="btn btn--pill" onClick={() => ensureSizeColumn(s)}>+ {s}</button>
              ))}
              <input className="input pill-input" placeholder="커스텀 (예: 28, 260, FREE)" value={newSize} onChange={(e) => setNewSize(e.target.value)} />
              <button type="button" className="btn btn--ghost" onClick={() => { ensureSizeColumn(newSize); setNewSize(""); }}>추가</button>
            </div>
          </div>
        </div>

        <div className="row row--full">
          <label className="label" htmlFor="description">설명</label>
          <textarea id="description" rows={4} className="textarea" value={form.description} onChange={(e) => setField("description", e.target.value)} />
        </div>

        <div className="row row--full">
          <label className="label" htmlFor="thumbnail">썸네일 이미지</label>
          <input
            id="thumbnail" type="file" accept="image/*"
            onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)} className="input"
          />
          {thumbnailFile && <div className="preview-wrap"><img src={thumbPreview} alt="썸네일 미리보기" className="preview" /></div>}
        </div>

        <div className="row row--full">
          <label className="label" htmlFor="images">상세 이미지 (여러 개 선택 가능)</label>
          <input
            id="images" type="file" accept="image/*" multiple
            onChange={(e) => addImages(e.target.files)} className="input"
          />
          {imagePreviews.length > 0 && (
            <div className="thumb-list">
              {imagePreviews.map((f, i) => (
                <div key={i} className="thumb-item">
                  <img src={f.url} alt={`상세-${i}`} className="thumb" title={f.name} />
                  <button
                    type="button"
                    className="btn btn--ghost btn--remove-thumb"
                    onClick={() => removeImageAt(i)}
                  >
                    제거
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="row">
          <label className="label" htmlFor="releaseDate">출시일시</label>
          <input id="releaseDate" type="datetime-local" className="input"
            value={form.releaseDate} onChange={(e) => setField("releaseDate", e.target.value)} />
        </div>
        <div className="row row--full">
          <label className="label" htmlFor="tagsText">태그 (쉼표/줄바꿈)</label>
          <textarea id="tagsText" rows={2} className="textarea"
            value={form.tagsText} onChange={(e) => setField("tagsText", e.target.value)} />
          {tags.length > 0 && (<div className="chips">{tags.map((t, i) => <span className="chip" key={i}>#{t}</span>)}</div>)}
        </div>

        <div className="row row--full actions">
          <button
            type="button"
            className="btn btn--ghost save-btn"
            onClick={() => alert("초안 저장은 추후 확장하세요.")}
          >
            임시 저장
          </button>
          <button className="btn" type="submit" disabled={submitting}>
            {submitting ? "등록 중..." : "등록하기"}
          </button>
        </div>
      </form>
    </div>
  );
}
