import React, { useState } from "react";
import RecoSurvey from "../../components/reco/RecoSurvey";
import RecoGrid from "../../components/reco/RecoGrid";
import { fetchRecommendations, fetchRecommendationsAndSave, STYLE_KOR, BODY_KOR } from "../../api/reco";
import { getAuth } from "../../lib/jwt";
import "../../css/reco.css";

export default function AiRecommend() {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [meta, setMeta] = useState(null);
  const [selectedId, setSelectedId] = useState(() => {
    const s = sessionStorage.getItem("ai_selected_product_id");
    return s ? Number(s) : null;
  });
  const handleSelect = (id) => {
    setSelectedId(id);
    sessionStorage.setItem("ai_selected_product_id", String(id));
  };
  const handleSubmit = async (answers) => {
    setBusy(true);
    try {
      const isLogin = !!getAuth()?.token;
      const { items, meta } = isLogin
        ? await fetchRecommendationsAndSave({ styles: answers.styles })
        : await fetchRecommendations({ styles: answers.styles });
      setItems(items || []);
      setMeta(meta || null);
    } finally {
      setBusy(false);
    }
  };
  const bodyKor = meta?.bodyType ? BODY_KOR[meta.bodyType] || meta.bodyType : "보통";
  const styleText = (meta?.preferredStyles || []).map((s) => STYLE_KOR[s] || s).join(", ");

  return (
    <div className="container ai-commend">
      <h2 className="title">AI 추천 코디</h2>
      <p className="sub">
        AI 맞춤 추천
        {meta && (
          <> · 추정 체형: <b>{bodyKor}</b>{styleText ? <> · 선택 스타일: <b>{styleText}</b></> : null}</>
        )}
      </p>

      <RecoSurvey onSubmit={handleSubmit} />

      {busy && <div className="loading mt-3">추천 계산 중...</div>}

      {!!items.length && (
        <>
          <h3 className="mt-4">추천 결과</h3>
          <RecoGrid items={items} selectedId={selectedId} onSelect={handleSelect} />
        </>
      )}
    </div>
  );
}
