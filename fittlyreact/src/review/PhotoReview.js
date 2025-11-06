import React, { useMemo, useState, useEffect, useCallback } from "react";
import "../css/PhotoReview.css";

export default function PhotoReview({ productId, initialLimit = 12, step = 12 }) {
  const [all, setAll] = useState([]);

  useEffect(() => {
    if (!productId) return;
    const fetchPhotos = async () => {
      try {
        const res = await fetch(`/api/reviews/product/${productId}`);
        if (!res.ok) throw new Error("이미지 데이터를 불러오지 못했습니다.");
        const data = await res.json();

        const photos = data
          .flatMap((r) =>
            Array.isArray(r.images)
              ? r.images.map((imgUrl, idx) => ({
                  id: `${r.id}-${idx}`,
                  image: imgUrl,
                }))
              : []
          )
          .filter((img) => !!img.image);

        setAll(photos);
      } catch (err) {
        console.error("🔥 포토리뷰 불러오기 실패:", err);
      }
    };
    fetchPhotos();
  }, [productId]);

  const basePhotos = useMemo(() => all.filter((r) => !!r.image), [all]);
  const [visible, setVisible] = useState(initialLimit);
  const canMore = visible < basePhotos.length;
  const photos = useMemo(() => basePhotos.slice(0, visible), [basePhotos, visible]);

  const [selIdx, setSelIdx] = useState(null);
  const isOpen = selIdx !== null;

  const openAt = (idx) => setSelIdx(idx);
  const close = () => setSelIdx(null);

  const prev = useCallback(() => {
    if (!isOpen) return;
    setSelIdx((i) => (i === 0 ? photos.length - 1 : i - 1));
  }, [isOpen, photos.length]);

  const next = useCallback(() => {
    if (!isOpen) return;
    setSelIdx((i) => (i === photos.length - 1 ? 0 : i + 1));
  }, [isOpen, photos.length]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") prev();
      else if (e.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, prev, next]);

  return (
    <div className="prl-wrap">
      <div className="prl-grid">
        {photos.map((r, i) => (
          <div key={r.id} className="prl-card">
            <img
              src={r.image}
              alt=""
              loading="lazy"
              onError={(e) => (e.currentTarget.src = "/images/no-image.png")}
              onClick={() => openAt(i)}
            />
          </div>
        ))}
      </div>

      {canMore && (
        <button
          className="prl-more"
          onClick={() => setVisible((v) => Math.min(v + step, basePhotos.length))}
        >
          더보기 ({basePhotos.length - visible}개 남음)
        </button>
      )}

      {isOpen && photos[selIdx] && (
        <div className="prl-modal" onClick={close}>
          <div className="prl-modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="prl-modal-close" onClick={close} aria-label="닫기">
              ✕
            </button>

            {photos.length > 1 && (
              <>
                <button className="prl-nav prev" onClick={prev} aria-label="이전">
                  ‹
                </button>
                <button className="prl-nav next" onClick={next} aria-label="다음">
                  ›
                </button>
              </>
            )}

            <img
              src={photos[selIdx].image}
              alt="리뷰 사진 확대"
              className="prl-modal-img"
            />
            <div className="prl-indicator">
              {selIdx + 1} / {photos.length}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}