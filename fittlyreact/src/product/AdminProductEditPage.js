import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
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
  DEFAULT: ["S", "M", "L"],
  TOP: ["S", "M", "L", "XL"],
  BOTTOM: ["24", "26", "28", "30", "32", "34"],
  OUTER: ["S", "M", "L", "XL"],
  SHOES: ["240", "250", "260", "270", "280"],
};

const clamp = (n, min, max) => Math.min(Math.max(n, min), max);
const toNum = (v) => (v === "" || v === null || v === undefined ? NaN : Number(v));
const fmtKRW = (n) => (Number.isFinite(n) ? n.toLocaleString("ko-KR") + "원" : "-원");
const parseCSV = (text) => (text || "").split(/[\n,]/g).map((s) => s.trim()).filter(Boolean);
const SIZE_ORDER = ["XXS","XS","S","M","L","XL","XXL","XXXL","FREE","ONE"];
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

export default function AdminProductEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "", brand: "", category: "",
    price: "", discountPrice: "", discountPercent: "",
    status: "SALE",
    description: "", material: "",
    styleCode: "", videoUrl: "", tagsText: "", releaseDate: ""
  });
  const [colors, setColors] = useState(["#000000"]);
  const [colorNames, setColorNames] = useState([""]);
  const [colorSizes, setColorSizes] = useState([{ color: "#000000", sizes: presetRows("") }]);
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [existingThumbUrl, setExistingThumbUrl] = useState(null);
  const [existingImages, setExistingImages] = useState([]);
  const [removedImages, setRemovedImages] = useState(new Set());
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
  const removeNewImageAt = (idx) => setImageFiles((prev) => prev.filter((_, i) => i !== idx));
  const toggleRemoveExisting = (url) => {
    setRemovedImages((prev) => {
      const n = new Set(prev);
      if (n.has(url)) n.delete(url);
      else n.add(url);
      return n;
    });
  };

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [lastEdited, setLastEdited] = useState(null);

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/products/${id}`, { withCredentials: true });
        if (ignore) return;
        const p = res.data;
        const price = p?.price ?? "";
        const discountPrice = p?.discountPrice ?? "";
        const percent =
          Number.isFinite(price) && Number.isFinite(discountPrice) && price > 0
            ? clamp(Math.round((1 - discountPrice / price) * 100), 0, 100)
            : "";

        setForm({
          name: p?.name ?? "",
          brand: p?.brand ?? "",
          category: p?.category ?? "",
          price: String(price ?? ""),
          discountPrice: discountPrice === null || discountPrice === undefined ? "" : String(discountPrice),
          discountPercent: percent === "" ? "" : String(percent),
          status: p?.status ?? "SALE",
          description: p?.description ?? "",
          material: p?.material ?? "",
          styleCode: p?.styleCode ?? "",
          videoUrl: p?.videoUrl ?? "",
          tagsText: (p?.tags || "").split(",").filter(Boolean).join(","),
          releaseDate: p?.releaseDate ? p.releaseDate.replace(" ", "T") : "",
        });

        const cs = Array.isArray(p?.colorSizes) ? p.colorSizes : [];
        if (cs.length) {
          setColors(cs.map((v) => v.color || "#000000"));
          setColorNames(cs.map((v) => v.colorName || ""));
          setColorSizes(
            cs.map((v) => ({
              color: v.color || "#000000",
              sizes: sanitizeSizes(v.sizes || []),
            }))
          );
        } else {
          const sizes = Array.isArray(p?.sizes) ? p.sizes : [];
          const rows = sanitizeSizes(sizes).length ? sanitizeSizes(sizes) : presetRows(p?.category);
          setColors([p?.color || "#000000"]);
          setColorNames([p?.colorNames?.split(",")?.[0] || ""]);
          setColorSizes([{ color: p?.color || "#000000", sizes: rows }]);
        }

        setExistingThumbUrl(p?.thumbnailUrl || null);
        setExistingImages(Array.isArray(p?.imageUrls) ? p.imageUrls : []);
      } catch (e) {
        alert(`상품 불러오기 실패\n${e?.response?.data || e?.message || e}`);
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => { ignore = true; };
  }, [id]);

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
    setColorSizes((arr) => arr.filter((_, i) => i !== idx));
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
    const preset = presetRows(form.category).map((r) => String(r.size).trim());
    setColorSizes((prev) =>
      prev.map((v) => {
        const map = new Map(sanitizeSizes(v.sizes).map((s) => [String(s.size).trim(), { ...s }]));
        preset.forEach((sz) => { if (!map.has(sz)) map.set(sz, { size: sz, stock: 0 }); });
        const sizes = Array.from(map.values()).sort((a,b)=>sizeSortKey(a.size)-sizeSortKey(b.size));
        return { ...v, sizes };
      })
    );
  }, [form.category]);

  const allSizes = useMemo(() => {
    const set = new Set();
    colorSizes.forEach((v) => v.sizes.forEach((s) => set.add(String(s.size).trim())));
    return Array.from(set).filter(Boolean).sort((a,b)=>sizeSortKey(a)-sizeSortKey(b));
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
      case "SHOES": return ["240","250","260","270","280"];
      case "BOTTOM": return ["24","26","28","30","32","34"];
      case "TOP":
      case "OUTER":
      default: return ["S","M","L","XL","FREE"];
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

  // 
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

  const validate = () => {
    if (!form.name.trim()) return "상품명을 입력하세요.";
    if (!form.brand.trim()) return "브랜드를 입력하세요.";
    if (!form.category.trim()) return "카테고리를 선택하세요.";
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
    if (form.discountPrice !== "" && (!Number.isFinite(dpNum) || dpNum < 0 || dpNum > priceNum))
      return "할인가는 0 이상이며 가격 이하여야 합니다.";
    if (form.discountPercent !== "" && (!Number.isFinite(perNum) || perNum < 0 || perNum > 100))
      return "할인율은 0~100 사이여야 합니다.";
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const err = validate();
    if (err) return alert(err);

    const { token } = getAuth();

    let discountPriceNum = null;
    if (form.discountPrice !== "") {
      discountPriceNum = clamp(toNum(form.discountPrice), 0, priceNum);
    } else if (form.discountPercent !== "") {
      const per = clamp(toNum(form.discountPercent), 0, 100);
      discountPriceNum = Math.round(priceNum * (1 - per / 100));
    }

    const flattened = [];
    colorSizes.forEach((v, idx) => {
      const cname = colorNames[idx] || "";
      sanitizeSizes(v.sizes).forEach((s) => {
        flattened.push({ color: v.color, colorName: cname, size: s.size, stock: Number(s.stock) || 0 });
      });
    });

    const removeImageUrls = Array.from(removedImages);

    const fd = new FormData();
    fd.append("brand", form.brand.trim());
    fd.append("name", form.name.trim());
    fd.append("price", String(priceNum));
    if (form.discountPercent !== "") fd.append("discountRate", String(clamp(toNum(form.discountPercent), 0, 100)));
    else if (discountPriceNum !== null) fd.append("discountPrice", String(discountPriceNum));
    fd.append("status", form.status);
    fd.append("categoryId", form.category.trim());
    fd.append("tags", parseCSV(form.tagsText).join(","));
    fd.append("removeImageUrls", JSON.stringify(removeImageUrls));
    fd.append("replaceVariants", JSON.stringify(flattened));
    if (thumbnailFile) fd.append("thumbnail", thumbnailFile);
    imageFiles.forEach((f) => fd.append("newImages", f));

    setSubmitting(true);
    try {
      await axios.put(`/api/admin/products/${id}`, fd, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        withCredentials: true,
      });
      alert("상품이 수정되었습니다.");
      navigate(-1);
    } catch (error) {
      console.error(error);
      const status = error?.response?.status;
      const data = error?.response?.data;
      const detail = typeof data === "string" ? data : data ? JSON.stringify(data, null, 2) : (error?.message || "수정 실패");
      alert(`요청 실패${status ? ` (${status})` : ""}\n${detail}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container admin-wrap"><div className="admin-loading">불러오는 중…</div></div>;
  }

  return (
    <div className="container admin-wrap">
      <header className="admin-header">
        <h1>관리자 상품 수정</h1>
        <p className="admin-desc">
          등록 화면과 동일한 편집 UX(프리셋/빠른 사이즈 추가·제거/색상별 재고/이미지 관리)
        </p>
      </header>

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="row">
          <label className="label" htmlFor="name">상품명</label>
          <input id="name" className="input" value={form.name} onChange={(e)=>setField("name", e.target.value)} required />
        </div>

        <div className="row">
          <label className="label" htmlFor="brand">브랜드</label>
          <input id="brand" className="input" value={form.brand} onChange={(e)=>setField("brand", e.target.value)} required />
        </div>

        <div className="row">
          <label className="label" htmlFor="category">카테고리</label>
          <select
            id="category" className="select" value={form.category}
            onChange={(e) => setField("category", e.target.value)} required
          >
            <option value="">선택하세요</option>
            {CATEGORIES.map((c) => <option key={c.code} value={c.code}>{c.label}</option>)}
          </select>
        </div>

        <div className="row">
          <label className="label" htmlFor="status">상태</label>
          <select id="status" className="select" value={form.status} onChange={(e)=>setField("status", e.target.value)}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        <div className="row">
          <label className="label" htmlFor="price">정가</label>
          <input id="price" type="number" min="0" className="input" value={form.price} onChange={onChangePrice} />
          <small className="muted">현재 계산된 할인가: <b>{fmtKRW(effectiveDp)}</b></small>
        </div>
        <div className="row">
          <label className="label" htmlFor="discountPercent">할인율(%)</label>
          <input id="discountPercent" type="number" min="0" max="100" className="input" value={form.discountPercent} onChange={onChangeDiscountPercent} />
        </div>
        <div className="row">
          <label className="label" htmlFor="discountPrice">할인가(원)</label>
          <input id="discountPrice" type="number" min="0" className="input" value={form.discountPrice} onChange={onChangeDiscountPrice} />
          <small className="muted">현재 계산된 할인율: <b>{Number.isFinite(effectivePer) ? `${effectivePer}%` : "-"}</b></small>
        </div>

        <div className="row">
          <label className="label" htmlFor="material">소재</label>
          <input id="material" className="input" value={form.material} onChange={(e)=>setField("material", e.target.value)} />
        </div>

        <div className="row row--full">
          <label className="label">색상(여러 개)</label>

          <div className="swatches swatches--bar" aria-label="선택된 색상 ">
            {colors.map((c, i) => <span key={i} className="swatch" title={c} style={{ background: c }} />)}
          </div>

          <div className="colors-grid">
            {colors.map((c, idx) => (
              <div className="color-row" key={idx}>
                <input type="color" className="input color-input" value={c}
                       onChange={(e) => changeColor(idx, e.target.value)} aria-label={`색상-${idx+1}`} />
                <input className="input hex-input" value={c}
                       onChange={(e) => changeColor(idx, e.target.value)} placeholder="#000000" />
                <input className="input" value={colorNames[idx] || ""}
                       onChange={(e) => changeColorName(idx, e.target.value)} placeholder="컬러 이름 (예: 블랙 / 차콜 / 베이지)" />
                <button type="button" className="btn btn--ghost btn--remove" onClick={() => removeColor(idx)}>삭제</button>
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
                      <div style={{display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
                        <span>{sz}</span>
                        <button type="button" title={`${sz} 열 제거`} aria-label={`${sz} 열 제거`}
                                onClick={() => removeSizeColumn(sz)}
                                style={{ border:"none", background:"transparent", cursor:"pointer", fontSize:14, lineHeight:1 }}>
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
                        <input className="input stock-input stock-cell" type="number" min="0"
                               value={getStock(cIdx, sz)} onChange={(e) => setStock(cIdx, sz, e.target.value)}
                               aria-label={`색상 ${v.color} - ${sz} 재고`} />
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
              <input className="input pill-input" placeholder="커스텀 (예: 28, 260, FREE)"
                     value={newSize} onChange={(e)=>setNewSize(e.target.value)} />
              <button type="button" className="btn btn--ghost"
                      onClick={() => { ensureSizeColumn(newSize); setNewSize(""); }}>
                추가
              </button>
            </div>
          </div>
        </div>

        <div className="row row--full">
          <label className="label" htmlFor="description">설명</label>
          <textarea id="description" rows={4} className="textarea" value={form.description}
                    onChange={(e)=>setField("description", e.target.value)} />
        </div>

        <div className="row row--full">
          <label className="label" htmlFor="thumbnail">썸네일 이미지</label>
          <input id="thumbnail" type="file" accept="image/*"
                 onChange={(e)=>setThumbnailFile(e.target.files?.[0] || null)} className="input" />
          <div className="preview-wrap">
            {thumbnailFile ? (
              <img src={thumbPreview} alt="새 썸네일" className="preview" />
            ) : existingThumbUrl ? (
              <img src={existingThumbUrl} alt="기존 썸네일" className="preview" />
            ) : null}
          </div>
        </div>

        <div className="row row--full">
          <label className="label" htmlFor="images">상세 이미지 (여러 개 선택 가능)</label>
          <input id="images" type="file" accept="image/*" multiple
                 onChange={(e)=>addImages(e.target.files)} className="input" />

          {existingImages.length > 0 && (
            <>
              <h4 className="muted" style={{marginTop:8}}>기존 이미지</h4>
              <div className="thumb-list">
                {existingImages.map((url) => (
                  <div key={url} className={`thumb-item ${removedImages.has(url) ? "thumb-removed" : ""}`}>
                    <img src={url} alt="기존" className="thumb" />
                    <button type="button" className="btn btn--ghost btn--remove-thumb"
                            onClick={() => toggleRemoveExisting(url)}>
                      {removedImages.has(url) ? "복원" : "제거"}
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}

          {imagePreviews.length > 0 && (
            <>
              <h4 className="muted" style={{marginTop:8}}>추가 예정 이미지</h4>
              <div className="thumb-list">
                {imagePreviews.map((f, i) => (
                  <div key={i} className="thumb-item">
                    <img src={f.url} alt={`새-${i}`} className="thumb" title={f.name} />
                    <button type="button" className="btn btn--ghost btn--remove-thumb"
                            onClick={() => removeNewImageAt(i)}>
                      제거
                    </button>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        <div className="row">
          <label className="label" htmlFor="releaseDate">출시일시</label>
          <input id="releaseDate" type="datetime-local" className="input"
                 value={form.releaseDate} onChange={(e)=>setField("releaseDate", e.target.value)} />
        </div>
        <div className="row row--full">
          <label className="label" htmlFor="tagsText">태그 (쉼표/줄바꿈)</label>
          <textarea id="tagsText" rows={2} className="textarea"
                    value={form.tagsText} onChange={(e)=>setField("tagsText", e.target.value)} />
        </div>

        <div className="row row--full actions">
          <button type="button" className="btn btn--ghost" onClick={()=>navigate(-1)}>뒤로</button>
          <button className="btn" type="submit" disabled={submitting}>{submitting ? "수정 중..." : "수정하기"}</button>
        </div>
      </form>
    </div>
  );
}
