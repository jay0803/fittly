import React, { useMemo } from "react";
import { useParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import "../css/MainPage.css";

const ALL_ITEMS = [
];

const LABELS = { top: "상의", bottom: "하의", outer: "아우터", shoes: "신발" };

export default function CategoryPage() {
  const { cat } = useParams();
  const items = useMemo(() => ALL_ITEMS.filter(i => i.cat === cat), [cat]);

  return (
    <div className="container" style={{ padding: "24px 16px" }}>
      <h2 style={{ margin: 0 }}>{LABELS[cat] ?? "카테고리"}</h2>
      <p style={{ color: "#777", margin: "6px 0 16px" }}>
        총 {items.length}개 상품
      </p>
      <div className="rec-grid">
        {items.length ? items.map(it => <ProductCard key={it.id} item={it} />) : <div>상품이 없습니다.</div>}
      </div>
    </div>
  );
}
