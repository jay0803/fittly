import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/notice.css";
import { getAuth } from "../lib/jwt";
import { http } from "../lib/http";
import axios from "axios";

export default function FaqDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);
  const { role } = getAuth();
  const { token } = getAuth();

  useEffect(() => {
    http.get(`/faqs/${id}`).then(setItem).catch((err) => {
      console.error(err);
      alert("FAQ를 불러오지 못했습니다.");
    });
  }, [id]);

  if (!item) return <div className="notice-page">로딩중...</div>;

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      // await http.delete(`/faqs/${id}`);
      await axios.delete(`/api/faqs/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
        });
      alert("삭제되었습니다.");
      navigate("/faq", { replace: true });
    } catch (err) {
      console.error(err);
      alert("삭제 실패: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="notice-page">
      <div className="notice-banner">
        <img src="/images/FAQBanner.png" alt="FAQ 배너"
             onError={(e)=>{ e.currentTarget.src="/images/no-image.png"; }} />
      </div>
      <div className="notice-detail">
        <h2 className="notice-detail-title">{item.title}</h2>
        <div className="notice-detail-meta">
          <span>카테고리: {item.category}</span>
          <span>등록일: {new Date(item.createdAt).toLocaleDateString()}</span>
          {item.updatedAt && <span>수정일: {new Date(item.updatedAt).toLocaleDateString()}</span>}
          <span>작성자: {item.authorName}</span>
        </div>
        <div className="notice-detail-content">{item.content}</div>
        <div className="notice-detail-actions">
          <button onClick={() => navigate("/faq")}>목록으로</button>
          {role === "ROLE_ADMIN" && (
            <>
              <button onClick={() => navigate("/faq/write")}>작성</button>
              <button onClick={() => navigate(`/faq/${id}/edit`)}>수정</button>
              <button onClick={handleDelete} style={{ color: "red" }}>삭제</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
