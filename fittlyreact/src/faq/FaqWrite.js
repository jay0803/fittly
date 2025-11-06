import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/notice.css";
import { http } from "../lib/http";

export default function FaqWrite() {
  const nav = useNavigate();
  const [category, setCategory] = useState("MEMBER");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await http.post("/faqs", { category, title, content });
      alert("FAQ가 등록되었습니다.");
      nav("/faq");
    } catch (err) {
      alert("FAQ 등록 실패: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="notice-page">
      <div className="notice-banner">
        <img src="/images/FAQBanner.png" alt="FAQ 배너"
             onError={(e)=>{ e.currentTarget.src="/images/no-image.png"; }} />
        <div className="notice-banner-text">
          <h1>FAQ 작성</h1>
          <p>관리자만 접근 가능한 페이지입니다.</p>
        </div>
      </div>
      <form className="notice-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>카테고리</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="MEMBER">회원</option>
            <option value="ORDER">주문/배송</option>
            <option value="PAYMENT">결제</option>
            <option value="PRODUCT">상품</option>
            <option value="ETC">기타</option>
          </select>
        </div>
        <div className="form-group">
          <label>제목</label>
          <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="form-group">
          <label>내용</label>
          <textarea rows="10" value={content} onChange={(e) => setContent(e.target.value)} required />
        </div>
        <div className="notice-detail-actions">
          <button type="submit">등록</button>
          <button type="button" onClick={() => nav("/faq")}>취소</button>
        </div>
      </form>
    </div>
  );
}
