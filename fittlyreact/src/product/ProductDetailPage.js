import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "../css/ProductDetailPage.css";
import { useWishlist } from "../wishlist/WishlistContext";
import { useCart } from "../cart/CartContext";
import { useAuth } from "../contexts/AuthContext";
import ReviewList from "../review/ReviewList";
import PhotoReview from "../review/PhotoReview";
import ReviewFilters from "../review/ReviewFilters";
import ProductQnaSection from "./ProductQnaSection";

const fmtKRW = (n) => (Number(n) || 0).toLocaleString() + "원";
const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi);
const parseCSV = (t) =>
  String(t || "")
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
const SIZE_ORDER = ["XXS","XS","S","M","L","XL","XXL","XXXL","FREE","ONE"];
const upper = (s) => String(s ?? "").trim().toUpperCase();
const norm = (s) => {
  if (s == null) return null;
  const v = String(s).trim();
  return v === "" ? null : v;
};
const sizeSortKey = (s) => {
  const up = upper(s);
  const idx = SIZE_ORDER.indexOf(up);
  if (idx >= 0) return idx;
  const num = Number(up);
  return Number.isFinite(num) ? 1000 + num : 2000 + up.charCodeAt(0);
};

const optKey = (pid, color, size) =>
  `${Number(pid)}::${upper(norm(color))}::${upper(norm(size))}`;

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [selColor, setSelColor] = useState("");
  const [selSize, setSelSize] = useState("");
  const { wishlistItems, toggleWishlistItem, loading: wishLoading, inFlightRequests } = useWishlist();
  const { addItemToCart, loading: cartLoading } = useCart();
  const { auth } = useAuth();
  const token =
    auth?.token || auth?.accessToken || auth?.jwt || auth?.user?.token || null;
  const role =
    auth?.role ||
    auth?.user?.role ||
    auth?.user?.authority ||
    auth?.user?.authorities?.[0]?.authority ||
    "";
  const isAdmin = role.includes("ADMIN");
  const isUser = role.includes("USER");

  const TABS = ["정보", "사이즈", "추천", "스냅·후기", "문의"];
  const [activeTab, setActiveTab] = useState("정보");
  const [reviewType, setReviewType] = useState("all");
  const [refreshKey, setRefreshKey] = useState(0);
  const [filterConditions, setFilterConditions] = useState({});
  const [reviewCounts, setReviewCounts] = useState({ total: 0, text: 0, photo: 0 });

  useEffect(() => {
    const handler = () => setRefreshKey((k) => k + 1);
    window.addEventListener("reviewUpdate", handler);
    return () => window.removeEventListener("reviewUpdate", handler);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const c = ReviewList?.getCount?.();
      if (c && (c.totalCount || c.textCount || c.photoCount)) {
        setReviewCounts({
          total: c.totalCount,
          text: c.textCount,
          photo: c.photoCount,
        });
      }
    }, 300);
    return () => clearInterval(interval);
  }, [refreshKey]);

  useEffect(() => {
    let ignore = false;
    const ctl = new AbortController();
    (async () => {
      try {
        setLoading(true);
        setError("");
        setErrorDetail("");
        const res = await fetch(`/api/products/${id}`, {
          headers: { Accept: "application/json" },
          credentials: "include",
          signal: ctl.signal,
        });
        if (!res.ok) {
          let bodyText = "";
          try {
            const ct = res.headers.get("content-type") || "";
            if (ct.includes("application/json")) {
              const j = await res.json();
              bodyText = JSON.stringify(j, null, 2);
            } else {
              bodyText = await res.text();
            }
          } catch {
            bodyText = "(응답 본문 읽기 실패)";
          }
          if (!ignore) {
            setError("상품 정보를 불러오지 못했습니다.");
            setErrorDetail(bodyText);
          }
          return;
        }
        const json = await res.json();
        if (!ignore) {
          setData(json);
          setActiveIdx(0);
        }
      } catch (e) {
        if (!ignore) {
          setError("상품 정보를 불러오지 못했습니다.");
          setErrorDetail(String(e?.message || e));
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    })();
    return () => {
      ignore = true;
      ctl.abort();
    };
  }, [id]);

  const productId = data?.id ?? data?.productId ?? null;
  const colorSizes = useMemo(() => {
    const arr = Array.isArray(data?.colorSizes) ? data.colorSizes : null;
    if (!arr || !arr.length) return null;
    return arr.map((v) => ({
      color: String(v?.color || "").trim(),
      colorName: String(v?.colorName || "").trim() || null,
      sizes: Array.isArray(v?.sizes)
        ? v.sizes
            .map((s) => ({
              size: String(s?.size || "").trim(),
              stock: Number(s?.stock ?? 0) || 0,
            }))
            .sort((a, b) => sizeSortKey(a.size) - sizeSortKey(b.size))
        : [],
    }));
  }, [data]);

  const hasColorOption = !!(colorSizes?.length);
  const colors = useMemo(
    () => (hasColorOption ? colorSizes.map((v) => v.color) : []),
    [colorSizes, hasColorOption]
  );

  const selectedColorName = useMemo(() => {
    if (!hasColorOption || !selColor) return null;
    return colorSizes.find((v) => v.color === selColor)?.colorName || null;
  }, [colorSizes, hasColorOption, selColor]);

  const colorDisplayList = useMemo(() => {
    const namesCsv = parseCSV(data?.colorNames);
    if (namesCsv.length) return namesCsv;
    const namesFromVariant = colorSizes?.map((v) => v.colorName).filter(Boolean) ?? [];
    if (namesFromVariant.length) return Array.from(new Set(namesFromVariant));
    if (hasColorOption) return colorSizes.map((v) => v.color);
    return parseCSV(data?.color);
  }, [data, colorSizes, hasColorOption]);

  const sizesForSelectedColor = useMemo(() => {
    if (hasColorOption && selColor) {
      const row = colorSizes.find((v) => v.color === selColor);
      return row ? row.sizes : [];
    }
    const plain = (Array.isArray(data?.sizes) ? data.sizes : []).map((s) => ({
      size: String(s?.size || "").trim(),
      stock: Number(s?.stock ?? 0) || 0,
    }));
    return plain.sort((a, b) => sizeSortKey(a.size) - sizeSortKey(b.size));
  }, [colorSizes, selColor, data, hasColorOption]);

  const hasSizeOption = sizesForSelectedColor.length > 0;

  useEffect(() => {
    if (hasColorOption) {
      setSelColor((prev) => (prev && colors.includes(prev) ? prev : colors[0]));
    } else {
      setSelColor("");
    }
  }, [colors, hasColorOption]);

  useEffect(() => {
    const firstAvail = (sizesForSelectedColor || []).find((s) => s.stock > 0)?.size || "";
    setSelSize((prev) =>
      prev && sizesForSelectedColor.some((s) => s.size === prev) ? prev : firstAvail
    );
    setQty(1);
  }, [sizesForSelectedColor]);

  const stockForSelected = useMemo(() => {
    if (!selSize) return hasSizeOption ? 0 : Infinity;
    const row = sizesForSelectedColor.find((s) => s.size === selSize);
    return row ? row.stock : 0;
  }, [sizesForSelectedColor, selSize, hasSizeOption]);

  useEffect(() => {
    if (Number.isFinite(stockForSelected) && stockForSelected > 0 && qty > stockForSelected) {
      setQty(stockForSelected);
    }
  }, [stockForSelected, qty]);

  const images = useMemo(() => {
    const list = [];
    if (data?.thumbnailUrl) list.push(data.thumbnailUrl);
    if (Array.isArray(data?.imageUrls)) list.push(...data.imageUrls.filter(Boolean));
    return list.length ? list : ["/images/placeholder.png"];
  }, [data]);

  const discountPercent = useMemo(() => {
    if (!data?.price || data?.discountPrice == null) return null;
    const p = Number(data.price);
    const d = Number(data.discountPrice);
    if (!Number.isFinite(p) || !Number.isFinite(d) || p <= 0 || d >= p) return null;
    return clamp(Math.round((1 - d / p) * 100), 0, 100);
  }, [data]);

  const pid = Number(productId || NaN);
  const currentKey = useMemo(
    () => optKey(pid, hasColorOption ? selColor : null, hasSizeOption ? selSize : null),
    [pid, selColor, selSize, hasColorOption, hasSizeOption]
  );
  const busy = inFlightRequests?.current?.has(currentKey);
  const isWished = useMemo(() => {
    if (!pid || !Array.isArray(wishlistItems)) return false;
    const C = upper(norm(hasColorOption ? selColor : null));
    const S = upper(norm(hasSizeOption ? selSize : null));
    return wishlistItems.some((it) => {
      const ipid = Number(it?.productId ?? it?.id ?? NaN);
      if (!Number.isFinite(ipid) || ipid !== pid) return false;
      const IC = upper(norm(it?.color));
      const IS = upper(norm(it?.size));
      return IC === C && IS === S;
    });
  }, [wishlistItems, pid, selColor, selSize, hasColorOption, hasSizeOption]);

  const optimisticPayload = useMemo(() => {
    if (!data || !pid) return null;
    const firstImage =
      data.thumbnailUrl ||
      (Array.isArray(data.imageUrls) && data.imageUrls.length ? data.imageUrls[0] : null);
    return {
      id: pid,
      productId: pid,
      name: data.name,
      productName: data.name,
      brand: data.brand,
      productBrand: data.brand,
      price: Number(data.discountPrice ?? data.price ?? 0),
      thumbnailUrl: firstImage,
      image: firstImage,
      color: norm(hasColorOption ? selColor : null),
      colorName: norm(hasColorOption ? selectedColorName : null),
      size: norm(hasSizeOption ? selSize : null),
    };
  }, [data, pid, selColor, selectedColorName, selSize, hasColorOption, hasSizeOption]);

  const handleToggleWishlist = async () => {
    if (!pid || busy) return;
    if (hasSizeOption && !selSize) return alert("사이즈를 선택해 주세요.");
    if (!token || !isUser || isAdmin) {
      alert("회원만 사용할 수 있는 기능입니다.");
      return;
    }

    const next = !isWished;
    try {
      const ok = await toggleWishlistItem({
        productId: pid,
        next,
        productOptional: next ? optimisticPayload : undefined,
        color: norm(hasColorOption ? selColor : null),
        colorName: norm(hasColorOption ? selectedColorName : null),
        size: norm(hasSizeOption ? selSize : null),
      });
      if (ok) {
        alert(next ? "찜 등록이 완료되었습니다." : "찜에서 제거되었습니다.");
      }
    } catch (e) {
      console.error("wishlist toggle error:", e);
      const msg = e?.response?.data?.message || e?.message;
      alert(msg ? `실패: ${msg}` : "처리 중 오류가 발생했습니다.");
    }
  };

  const addToCart = async () => {
    if (!pid) return;
    if (hasSizeOption && !selSize) return alert("사이즈를 선택해 주세요.");
    if (qty < 1) return alert("수량은 1개 이상이어야 합니다.");
    if (!token || !isUser || isAdmin) {
      alert("회원만 사용할 수 있는 기능입니다.");
      return;
    }
    try {
      await addItemToCart({
        productId: pid,
        quantity: qty,
        color: norm(hasColorOption ? selColor : null),
        size: norm(hasSizeOption ? selSize : null),
      });
      if (window.confirm("장바구니에 담았어요. 장바구니로 이동할까요?")) {
        navigate("/cart");
      }
    } catch (e) {
      alert(`장바구니 담기 실패: ${e?.message || e}`);
    }
  };

  const buyNow = () => {
    if (hasSizeOption && !selSize) return alert("사이즈를 선택해 주세요.");
    if (qty < 1) return alert("수량은 1개 이상이어야 합니다.");
    if (!token || !isUser || isAdmin) {
      alert("회원만 사용할 수 있는 기능입니다.");
      return;
    }
    const item = {
      productId: pid,
      productName: data?.name || "",
      quantity: qty,
      price: Number(data?.discountPrice ?? data?.price ?? 0) || 0,
      color: norm(hasColorOption ? selColor : null),
      colorName: norm(hasColorOption ? selectedColorName : null),
      size: norm(hasSizeOption ? selSize : null),
    };
    navigate("/payment", {
      state: {
        mode: "buynow",
        products: [item],
      },
    });
  };

  const handleReviewCreated = () => setRefreshKey((k) => k + 1);

  if (loading)
    return <div className="pd-wrap container"><div className="pd-loading">불러오는 중…</div></div>;
  if (error)
    return (
      <div className="pd-wrap container">
        <div className="pd-error">{error}</div>
        {errorDetail && <pre className="pd-error-raw">{errorDetail}</pre>}
      </div>
    );
  if (!data) return null;

  const specRows = [
    { k: "카테고리", v: data.category },
    { k: "색상", v: colorDisplayList.length ? colorDisplayList.join(", ") : "-" },
    { k: "소재", v: data.material },
    {
      k: "태그",
      v:
        data.tags &&
        String(data.tags)
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
          .map((t) => `#${t}`)
          .join(" "),
    },
  ].filter((r) => r.v);

  const detailImages = Array.isArray(data?.detailImages) ? data.detailImages : [];
  const detailHtml = data?.detailHtml;

  return (
    <div className="pd-wrap container">
      <button className="pd-back" onClick={() => navigate(-1)}>← 뒤로</button>

      <div className="pd-grid">
        {/* 갤러리 */}
        <div className="pd-gallery">
          <div className="pd-main">
            <img src={images[activeIdx]} alt={data.name}
              onError={(e)=>{ e.currentTarget.src="/images/placeholder.png"; }} />
          </div>
          <div className="pd-thumbs">
            {images.map((src, i) => (
              <button key={i} className={`pd-thumb ${activeIdx === i ? "active" : ""}`}
                onClick={() => setActiveIdx(i)}>
                <img src={src} alt={`thumb-${i}`}
                  onError={(e)=>{ e.currentTarget.src="/images/placeholder.png"; }} />
              </button>
            ))}
          </div>
        </div>

        <div className="pd-info">
          <div className="pd-brand">{data.brand}</div>
          <h1 className="pd-name">{data.name}</h1>

          <div className="pd-price">
            {data.discountPrice != null && data.discountPrice < (data.price ?? 0) ? (
              <>
                <span className="pd-sale">{fmtKRW(data.discountPrice)}</span>
                <span className="pd-original">{fmtKRW(data.price)}</span>
                {discountPercent != null && <span className="pd-badge">-{discountPercent}%</span>}
              </>
            ) : (
              <span className="pd-sale">{fmtKRW(data.price)}</span>
            )}
          </div>

          <div className="pd-meta">
            {specRows.map((r, i) => (
              <div key={i} className="pd-meta-row">
                <span className="key">{r.k}</span>
                <span className="val">{r.v}</span>
              </div>
            ))}
          </div>

          <div className="pd-purchase">
            {hasColorOption && (
              <div className="pd-color">
                <div className="label">색상 {selectedColorName ? `: ${selectedColorName}` : ""}</div>
                <div className="swatches">
                  {colors.map((c) => {
                    const active = selColor === c;
                    const cname = colorSizes.find((v) => v.color === c)?.colorName || c;
                    return (
                      <button key={c} type="button"
                        className={`swatch ${active ? "active" : ""}`}
                        onClick={() => setSelColor(c)}
                        style={{
                          background: c,
                          width: 20,
                          height: 20,
                          borderRadius: 14,
                          border: active ? "2px solid #111" : "1px solid rgba(0,0,0,.15)",
                        }}
                        title={cname}
                      />
                    );
                  })}
                </div>
              </div>
            )}

            {hasSizeOption && (
              <div className="pd-size">
                <div className="label">사이즈</div>
                <div className="sizes">
                  {sizesForSelectedColor.map((s) => {
                    const disabled = s.stock <= 0;
                    const active = selSize === s.size;
                    return (
                      <button key={`${selColor}-${s.size}`}
                        className={`size-chip ${active ? "active" : ""}`}
                        disabled={disabled}
                        onClick={() => setSelSize(s.size)}>
                        {s.size}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="pd-qty">
              <div className="label">수량</div>
              <div className="qty-box">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))}>-</button>
                <input type="number" min={1} value={qty}
                  max={Number.isFinite(stockForSelected) ? (stockForSelected || 1) : undefined}
                  onChange={(e) => {
                    const max = Number.isFinite(stockForSelected) ? (stockForSelected || 1) : Infinity;
                    setQty(clamp(Number(e.target.value) || 1, 1, max));
                  }} />
                <button onClick={() => {
                  const max = Number.isFinite(stockForSelected) ? (stockForSelected || 1) : Infinity;
                  setQty((q) => clamp(q + 1, 1, max));
                }}>+</button>
              </div>
              {Number.isFinite(stockForSelected) && <div className="stock-hint">재고: {stockForSelected}개</div>}
            </div>

            <div className="pd-actions">
              <button className={`btn outline ${isWished ? "active" : ""}`}
                disabled={wishLoading || busy || isAdmin}
                onClick={handleToggleWishlist}>
                {isWished ? "♥ 찜 해제" : "♡ 찜"}
              </button>
              <button className="btn outline"
                onClick={addToCart}
                disabled={cartLoading || isAdmin}>장바구니</button>
              <button className="btn" onClick={buyNow} disabled={isAdmin}>바로구매</button>
            </div>
          </div>
        </div>
      </div>

      <div className="pd-tabs-wrap">
        <div className="pd-tabs">
          {TABS.map((t) => (
            <button
              key={t}
              className={`pd-tab ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t === "스냅·후기" ? (
                <span style={{ display: "flex", flexDirection: "column", alignItems: "center", lineHeight: 1.2 }}>
                  <span>스냅·후기</span>
                  <span style={{ fontSize: "13px", color: "#888", marginTop: "3px" }}>
                    {reviewCounts.total}
                  </span>
                </span>
              ) : (
                t
              )}
            </button>
          ))}
        </div>

        <div className="pd-tabpanel">
          {activeTab === "정보" && (
            <div className="pd-info-tab">
              {detailHtml ? (
                <div className="pd-detail-html" dangerouslySetInnerHTML={{ __html: detailHtml }} />
              ) : detailImages.length ? (
                <div className="pd-detail-images">
                  {detailImages.map((src, i) => (
                    <img key={i} src={src} alt={`detail-${i}`} />
                  ))}
                </div>
              ) : data.description ? (
                <div className="pd-detail-fallback">
                  <h3>25FW CITY LEISURE</h3>
                  <p className="pd-desc">{data.description}</p>
                </div>
              ) : null}
            </div>
          )}

          {activeTab === "사이즈" && (
            <div className="pd-size-tab">
              {sizesForSelectedColor.length ? (
                <ul className="pd-size-list">
                  {sizesForSelectedColor.map((s) => (
                    <li key={s.size}>
                      <span className="sz">{s.size}</span>
                      <span className={`st ${s.stock > 0 ? "ok" : "oos"}`}>
                        {s.stock > 0 ? `재고 ${s.stock}개` : "품절"}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : <div className="pd-empty">사이즈 정보가 없습니다.</div>}
            </div>
          )}

          {activeTab === "추천" && <div className="pd-empty">AI 추천 코디가 여기에 표시됩니다.</div>}

         {activeTab === "스냅·후기" && (
            <div className="snap-section">
              <PhotoReview productId={data.id} />
              <div className="review-switch">
                <button
                  className={`rs-btn ${reviewType === "all" ? "active" : ""}`}
                  onClick={() => setReviewType("all")}
                >
                  <span className="rs-label">전체</span>
                  <span className="rs-count">{reviewCounts.total}</span>
                </button>

                <button
                  className={`rs-btn ${reviewType === "text" ? "active" : ""}`}
                  onClick={() => setReviewType("text")}
                >
                  <span className="rs-label">일반후기</span>
                  <span className="rs-count">{reviewCounts.text}</span>
                </button>

                <button
                  className={`rs-btn ${reviewType === "photo" ? "active" : ""}`}
                  onClick={() => setReviewType("photo")}
                >
                  <span className="rs-label">포토후기</span>
                  <span className="rs-count">{reviewCounts.photo}</span>
                </button>
              </div>

              <ReviewFilters
                colors={colorDisplayList}
                sizes={sizesForSelectedColor.map((s) => s.size)}
                onFilterChange={(filters) => setFilterConditions(filters)}
              />

              <ReviewList
                key={refreshKey}
                productId={data.id}
                filter={reviewType}
                refreshKey={refreshKey}
                filterConditions={filterConditions}
              />
            </div>
          )}

          {activeTab === "문의" && (
            <div className="pd-qna-tab">
              <ProductQnaSection productId={data.id} productCode={data.productCode} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
