import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/notice.css";
import { getAuth } from "../lib/jwt";
import { http } from "../lib/http";
import axios from "axios";

export default function FaqEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [category, setCategory] = useState("MEMBER");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const { token } = getAuth();

  useEffect(() => {
    http.get(`/faqs/${id}`).then((data) => {
      if(data.category=='회원') setCategory('MEMBER');
      else if(data.category=='주문/배송') setCategory('ORDER');
      else if(data.category=='결제') setCategory('PAYMENT');
      else if(data.category=='상품') setCategory('PRODUCT');
      else  setCategory('ETC');
      
      setTitle(data.title);
      setContent(data.content);
    });
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // await http.put(`/faqs/${id}`, { category, title, content });
      await axios.put(`/api/faqs/${id}`, { category, title, content }, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
        });
      alert("FAQ가 수정되었습니다.");
      // nav(`/faq/${id}`);
    } catch (err) {
      alert("FAQ 수정 실패: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="notice-page">
      <div className="notice-banner">
        <img src="/images/FAQBanner.png" alt="FAQ 배너"
             onError={(e)=>{ e.currentTarget.src="/images/no-image.png"; }} />
        <div className="notice-banner-text">
          <h1>FAQ 수정</h1>
          <p>관리자만 접근 가능한 페이지입니다.</p>
        </div>
      </div>

      <form className="notice-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>카테고리{category}</label>
          <select defaultValue={category} value={category} onChange={(e) => setCategory(e.target.value)}>
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
          <button type="submit">수정 완료</button>
          <button type="button" onClick={() => nav(`/faq/${id}`)}>취소</button>
        </div>
      </form>
    </div>
  );
}
