import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/notice.css";
import { getAuth } from "../lib/jwt";
import { http } from "../lib/http";
import axios from "axios";

export default function NoticeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [item, setItem] = useState(null);

  const { role } = getAuth();

  useEffect(() => {
    http.get(`/notices/${id}`).then(setItem).catch((err) => {
      console.error(err);
      alert("공지사항을 불러오지 못했습니다.");
    });
  }, [id]);

  if (!item) return <div className="notice-page">로딩중...</div>;

  const handleDelete = async () => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;
    try {
      
      const { token } = getAuth();
      // await http.delete(`/notices/${id}`);
      await axios.delete(`/api/notices/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
        });
      alert("삭제되었습니다.");
      navigate("/notice");
    } catch (err) {
      console.error(err);
      alert("삭제 실패: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="notice-page">
      <div className="notice-banner">
        <img src="/images/NoticeBanner.png"
           alt="공지 배너"
           onError={(e) => (e.currentTarget.src = "/images/no-image.png")}/>
      </div>
      <div className="notice-detail">
        <h2 className="notice-detail-title">{item.title}</h2>
        <div className="notice-detail-meta">
          <span>등록일: {new Date(item.createdAt).toLocaleDateString()}</span>
          {item.updatedAt && (
            <span>수정일: {new Date(item.updatedAt).toLocaleDateString()}</span>
          )}
          <span>작성자: {item.authorName}</span>
          <span>조회수: {item.views}</span>
        </div>
        <div className="notice-detail-content">{item.content}</div>
        <div className="notice-detail-actions">
          <button onClick={() => navigate("/notice", { replace: true })}>목록으로</button>
          {role === "ROLE_ADMIN" && (
            <>
              <button onClick={() => navigate("/notice/write")}>작성</button>
              <button onClick={() => navigate(`/notice/edit/${id}`)}>수정</button>
              <button onClick={handleDelete} style={{ color: "red" }}>
                삭제
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
