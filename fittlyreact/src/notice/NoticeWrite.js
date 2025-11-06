import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../css/notice.css";
import { getAuth } from "../lib/jwt";
import { http } from "../lib/http";

export default function NoticeWrite() {
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [pinOrder, setPinOrder] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await http.post("/notices", { title, content, pinned, pinOrder });
      alert("공지사항이 등록되었습니다.");
      nav("/notice");
    } catch (err) {
      alert("공지 등록 실패: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="notice-page">
      <div className="notice-banner">
        <img src="/images/NoticeBanner.png" alt="공지사항 배너" />
        <div className="notice-banner-text">
          <h1>공지사항 작성</h1>
          <p>관리자만 접근 가능한 페이지입니다.</p>
        </div>
      </div>
      <form className="notice-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>제목</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label>내용</label>
          <textarea
            rows="10"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>
        <div className="form-group form-inline">
          <label>
            <input
              type="checkbox"
              checked={pinned}
              onChange={(e) => setPinned(e.target.checked)}
            />
            상단 고정
          </label>
          {pinned && (
            <input
              type="number"
              value={pinOrder}
              min="0"
              onChange={(e) => setPinOrder(Number(e.target.value))}
              placeholder="고정 순서"
              style={{ width: "120px", marginLeft: "12px" }}
            />
          )}
        </div>
        <div className="notice-detail-actions">
          <button type="submit">등록</button>
          <button type="button" onClick={() => nav("/notice")}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
