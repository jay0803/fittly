import React, { useMemo, useState, useEffect } from "react";
import "../css/ReviewForm.css";
import "../css/PhotoReview.css";
import ReviewNotice from "./ReviewNotice";
import { http } from "../lib/http";
import { useReview } from "./ReviewContext";

export default function ReviewForm({
  product = {},
  defaultRating = 0,
  defaultContent = "",
  onSubmit,
}) {
  const [rating, setRating] = useState(defaultRating);
  const [content, setContent] = useState(defaultContent);
  const [files, setFiles] = useState([]);
  const [sex, setSex] = useState("F");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [agreeUse, setAgreeUse] = useState(false);
  const [agreeInfo, setAgreeInfo] = useState(false);
  const [agreeAll, setAgreeAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const [showNotice, setShowNotice] = useState(false);
  const { addWritten, removeWritable } = useReview();

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await http.get("/api/me");
        if (res.height) setHeight(res.height);
        if (res.weight) setWeight(res.weight);
      } catch (err) {
        console.error("❌ 프로필 불러오기 실패:", err);
      }
    };
    fetchProfile();
  }, []);

  const toggleAgreeAll = () => {
    const next = !agreeAll;
    setAgreeAll(next);
    setAgreeUse(next);
    setAgreeInfo(next);
  };

  useEffect(() => {
    if (agreeUse && agreeInfo) setAgreeAll(true);
    else setAgreeAll(false);
  }, [agreeUse, agreeInfo]);

  const onPickFiles = (e) => {
    const newFiles = Array.from(e.target.files || []);
    const merged = [...files, ...newFiles];
    if (merged.length > 3) {
      alert("사진은 최대 3장까지만 첨부할 수 있습니다.");
      setFiles(merged.slice(0, 3));
    } else {
      setFiles(merged);
    }
  };

  const previews = useMemo(
    () => files.map((f) => ({ name: f.name, url: URL.createObjectURL(f) })),
    [files]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("별점을 선택해주세요.");
    if (!content.trim()) return alert("리뷰 내용을 입력해주세요.");
    if (!agreeUse || !agreeInfo)
      return alert("필수 동의 항목에 모두 체크해주세요.");

    try {
      setBusy(true);
      const formData = new FormData();
      formData.append("productId", product.productId);
      formData.append("orderId", product.orderId);
      formData.append("orderItemId", product.orderItemId);
      formData.append("rating", rating);
      formData.append("content", content);
      formData.append("sex", sex);
      formData.append("height", height);
      formData.append("weight", weight);
      files.forEach((f) => formData.append("images", f));

      const res = await http.post("/api/reviews", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 400 || res.data?.message?.includes("이미")) {
        alert("이미 이 상품에 대한 후기를 작성하셨습니다.");
        return;
      }

      addWritten(res.data);
      removeWritable(product.productId);

      alert("리뷰가 등록되었습니다.");
      if (typeof onSubmit === "function") onSubmit(res.data);
    } catch (err) {
      console.error(err);
      alert("리뷰 등록 중 오류가 발생했습니다.");
    } finally {
      setBusy(false);
    }
  };

  const thumbnailUrl = product.thumbnailUrl || product.thumbnail;

  return (
    <form className="rc" onSubmit={handleSubmit}>
      <div className="rc-grid">
        <section className="rc-left">
          <div className="rc-product">
            <div className="rc-thumb">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={product.productName}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                />
              ) : (
                <div className="rc-thumb-ph" />
              )}
            </div>

            <div className="rc-product-meta">
              <div className="rc-product-name">{product.productName}</div>
              {product.brand && <div className="rc-brand">{product.brand}</div>}
              {(product.size || product.color) && (
                <div className="rc-product-opt">
                  {product.size && <span>{product.size}</span>}
                  {product.size && product.color && <span> / </span>}
                  {product.color && <span>{product.color}</span>}
                </div>
              )}
            </div>
          </div>

          <div className="rc-rating-wrap">
            <div className="rc-q-sub">
              별점을 입력해주세요 <span className="req">(필수)</span>
            </div>
            <div className="rc-stars">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  className={`rc-star ${rating >= n ? "on" : ""}`}
                  onClick={() => setRating(n)}
                >
                  ★
                </button>
              ))}
            </div>
          </div>

          <div className="rc-field comment-block">
            <label className="rc-label">
              어떤 점이 좋았나요? <span className="req">(필수)</span>
            </label>
            <textarea
              className="rc-textarea"
              rows={8}
              maxLength={500}
              placeholder="상품의 장단점을 솔직하게 작성해주세요."
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
            <div className="rc-count">{content.length}/500</div>
          </div>
        </section>

        <section className="rc-right">
          <div className="rc-field">
            <label className="rc-label">사진 첨부 (최대 3장)</label>
            <div className="rc-uploader">
              <label className="rc-upload-tile">
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  hidden
                  onChange={onPickFiles}
                />
                <span className="rc-plus">＋</span>
              </label>
              <div className="rc-previews">
                {previews.map((p, i) => (
                  <div className="rc-prev" key={p.name}>
                    <img src={p.url} alt={p.name} />
                    <button
                      type="button"
                      className="rc-del"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFiles(files.filter((_, idx) => idx !== i));
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <h3 className="rc-side-title">내 체형정보를 입력해주세요 (선택)</h3>
          <div className="rc-field">
            <label className="rc-label">성별</label>
            <div className="rc-sexbx">
              <button
                type="button"
                className={`rc-chip ${sex === "F" ? "active" : ""}`}
                onClick={() => setSex("F")}
              >
                여성
              </button>
              <button
                type="button"
                className={`rc-chip ${sex === "M" ? "active" : ""}`}
                onClick={() => setSex("M")}
              >
                남성
              </button>
            </div>
          </div>

          <div className="rc-grid-2">
            <div className="rc-field">
              <label className="rc-label">키</label>
              <div className="rc-input-unit">
                <input
                  inputMode="numeric"
                  value={height}
                  onChange={(e) =>
                    setHeight(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="170"
                />
                <span className="unit">cm</span>
              </div>
            </div>

            <div className="rc-field">
              <label className="rc-label">몸무게</label>
              <div className="rc-input-unit">
                <input
                  inputMode="numeric"
                  value={weight}
                  onChange={(e) =>
                    setWeight(e.target.value.replace(/[^\d]/g, ""))
                  }
                  placeholder="60"
                />
                <span className="unit">kg</span>
              </div>
            </div>
          </div>

          <div className="rc-checks">
            <label className="rc-check">
              <input
                type="checkbox"
                checked={agreeAll}
                onChange={toggleAgreeAll}
              />
              전체 동의하기
            </label>
            <label className="rc-check">
              <input
                type="checkbox"
                checked={agreeUse}
                onChange={(e) => setAgreeUse(e.target.checked)}
              />
              작성된 후기는 FITTLY 홍보 콘텐츠로 사용될 수 있습니다. (필수)
            </label>
            <label className="rc-check">
              <input
                type="checkbox"
                checked={agreeInfo}
                onChange={(e) => setAgreeInfo(e.target.checked)}
              />
              후기 서비스 품질 향상을 위한 성별/키/몸무게 정보 수집에
              동의합니다. (필수)
            </label>
          </div>

          <div className="rc-actions-col">
            <button type="submit" className="rc-submit" disabled={busy}>
              {busy ? "등록 중…" : "등록하기"}
            </button>
            <button
              type="button"
              className="rc-more-bottom"
              onClick={() => setShowNotice(true)}
            >
              작성시 유의사항 ›
            </button>
          </div>
        </section>
      </div>

      {showNotice && <ReviewNotice onClose={() => setShowNotice(false)} />}
    </form>
  );
}
