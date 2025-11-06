import React, { useEffect, useMemo, useState, useCallback } from "react";
import "../css/ReviewList.css";
import "../css/PhotoReview.css";

const toDate = (s) => new Date(s);
const cmpLatest = (a, b) => toDate(b.date) - toDate(a.date);

const formatDate = (dateString) => {
  if (!dateString) return "";
  const d = new Date(dateString);
  const yy = String(d.getFullYear()).slice(-2);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return (d.getHours() || d.getMinutes())
    ? `${yy}.${mm}.${dd} ${hh}:${mi}`
    : `${yy}.${mm}.${dd}`;
};

const Stars = ({ rating }) => (
  <span className="review-stars">
    {"★".repeat(Math.max(0, Math.min(5, rating)))}{" "}
    {"☆".repeat(Math.max(0, 5 - rating))}
  </span>
);

export default function ReviewList({
  productId,
  filter = "all",
  refreshKey,
  filterConditions = {},
}) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const fetchReviews = useCallback(async () => {
    if (!productId) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/reviews/product/${productId}`);
      if (!res.ok) throw new Error("리뷰 데이터를 불러오지 못했습니다.");
      const data = await res.json();

      const mapped = data.map((r) => ({
        id: r.id,
        user: r.userName,
        rating: r.rating,
        comment: r.content,
        date: r.createdAt,
        sex: r.sex,
        height: r.height,
        weight: r.weight,
        color: r.colorName || r.color || "",
        size: r.size || "",
        images: Array.isArray(r.images) ? r.images : [],
      }));
      setReviews(mapped);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews, refreshKey]);

  useEffect(() => {
    const handler = () => fetchReviews();
    window.addEventListener("reviewUpdate", handler);
    return () => window.removeEventListener("reviewUpdate", handler);
  }, [fetchReviews]);

  const sorted = useMemo(() => [...reviews].sort(cmpLatest), [reviews]);
  const totalCount = reviews.length;
  const textCount = reviews.filter((r) => !r.images?.length).length;
  const photoCount = reviews.filter((r) => r.images?.length).length;
  window.__reviewCounts = { totalCount, textCount, photoCount };

  const filtered = useMemo(() => {
    let base = [...sorted];

    if (filter === "photo") base = base.filter((r) => r.images?.length > 0);
    else if (filter === "text") base = base.filter((r) => !r.images?.length);

    if (filterConditions.gender?.length) {
      base = base.filter((r) => {
        const g = r.sex === "M" ? "남성" : "여성";
        return filterConditions.gender.includes(g);
      });
    }

    if (filterConditions.colors?.length) {
      base = base.filter((r) => filterConditions.colors.includes(r.color));
    }

    if (filterConditions.sizes?.length) {
      base = base.filter((r) => filterConditions.sizes.includes(r.size));
    }

    if (filterConditions.heightRange) {
      const { min, max } = filterConditions.heightRange;
      base = base.filter(
        (r) => r.height && r.height >= min && r.height <= max
      );
    }
    if (filterConditions.weightRange) {
      const { min, max } = filterConditions.weightRange;
      base = base.filter(
        (r) => r.weight && r.weight >= min && r.weight <= max
      );
    }

    return base;
  }, [sorted, filter, filterConditions]);

  const [open, setOpen] = useState(false);
  const [photoSet, setPhotoSet] = useState([]);
  const [idx, setIdx] = useState(0);
  const openModal = useCallback((images, i) => {
    if (!images || !images.length) return;
    setPhotoSet(images);
    setIdx(i);
    setOpen(true);
  }, []);

  const close = () => setOpen(false);
  const prev = (e) => {
    e?.stopPropagation?.();
    setIdx((i) => (i === 0 ? photoSet.length - 1 : i - 1));
  };
  const next = (e) => {
    e?.stopPropagation?.();
    setIdx((i) => (i === photoSet.length - 1 ? 0 : i + 1));
  };

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, photoSet.length]);

  if (loading) return <p style={{ textAlign: "center" }}>리뷰 불러오는 중...</p>;
  if (error)
    return <p style={{ color: "red", textAlign: "center" }}>{error}</p>;
  if (!filtered.length)
    return <p style={{ textAlign: "center" }}>작성된 후기가 없습니다.</p>;

  return (
    <>
      <div className="review-list">
        {filtered.map((r) => (
          <div key={r.id} className="review-item">
            <div className="review-header">
              <img
                src="/images/user-placeholder.png"
                alt=""
                className="review-avatar"
              />
              <div className="review-meta">
                <span className="review-user">{r.user}</span>
                <span className="review-date">{formatDate(r.date)}</span>
              </div>
            </div>

            <div className="review-rating">
              <Stars rating={r.rating} />
              <span className="review-score">{r.rating}</span>
            </div>

            {r.sex && (
              <div className="review-extra">
                <span className="review-option">
                  <span className="label">체형정보</span>{" "}
                  <b>
                    {r.sex === "M" ? "남성" : "여성"}
                    {r.height ? ` · ${r.height}cm` : ""}
                    {r.weight ? ` · ${r.weight}kg` : ""}
                  </b>
                </span>
              </div>
            )}

            {(r.color || r.size) && (
              <div className="review-extra">
                <span className="review-option">
                  <span className="label">구매옵션</span>{" "}
                  <b>
                    {r.color}
                    {r.color && r.size ? " / " : ""}
                    {r.size}
                  </b>
                </span>
              </div>
            )}

            {r.images?.length > 0 && (
              <div className="review-image-row">
                {r.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    alt=""
                    onClick={() => openModal(r.images, i)}
                    style={{ cursor: "zoom-in" }}
                  />
                ))}
              </div>
            )}

            <div className="review-comment">{r.comment}</div>
          </div>
        ))}
      </div>

      {open && photoSet.length > 0 && (
        <div className="prl-modal" onClick={close}>
          <div className="prl-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="prl-modal-close" onClick={close}>
              ✕
            </button>

            {photoSet.length > 1 && (
              <>
                <button className="prl-nav prev" onClick={prev}>
                  ‹
                </button>
                <button className="prl-nav next" onClick={next}>
                  ›
                </button>
              </>
            )}

            <img
              src={photoSet[idx]}
              alt="리뷰 이미지 확대"
              className="prl-modal-img"
            />
            <div className="prl-indicator">
              {idx + 1} / {photoSet.length}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

ReviewList.getCount = () => ({
  totalCount: window.__reviewCounts?.totalCount || 0,
  textCount: window.__reviewCounts?.textCount || 0,
  photoCount: window.__reviewCounts?.photoCount || 0,
});
