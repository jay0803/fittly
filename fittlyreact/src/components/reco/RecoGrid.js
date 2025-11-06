import React from "react";
import { Link } from "react-router-dom";

export default function RecoGrid({ items = [], selectedId, onSelect }) {
  if (!items.length)
    return <div className="p-4">조건에 맞는 추천을 찾지 못했어요. 선택을 넓혀보실래요?</div>;

  const handleCardClick = (id) => {
    onSelect?.(id);
  };

  return (
    <div className="reco-grid">
      {items.map((it) => {
        const active = selectedId === it.id;
        return (
          <div
            key={it.id}
            className={`reco-card ${active ? "active" : ""}`}
            onClick={() => handleCardClick(it.id)}
            role="button"
            tabIndex={0}
            aria-pressed={active}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleCardClick(it.id);
              }
            }}
          >
            <div className="thumb">
              <img src={it.imageUrl} alt={it.name} />
            </div>
            <div className="info">
              <div className="name">{it.name}</div>
              <div className="price">{Number(it.price).toLocaleString()}원</div>
              <div className="tags">
                {(it.tags || []).map((t) => (
                  <span className="tag" key={t}>
                    #{t}
                  </span>
                ))}
              </div>
              {it.reason && <div className="reason">{it.reason}</div>}
            </div>
            <Link
              className={`btn ghost ${active ? "active" : ""}`}
              to={`/products/${it.id}`}
              onClick={(e) => {
              }}
            >
              보러가기
            </Link>
          </div>
        );
      })}
    </div>
  );
}
