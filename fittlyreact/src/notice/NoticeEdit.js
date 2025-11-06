import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "../css/notice.css";
import { http } from "../lib/http";
import { getAuth } from "../lib/jwt";
import axios from "axios";

export default function NoticeEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [pinned, setPinned] = useState(false);
  const [pinOrder, setPinOrder] = useState(0);
  const { role } = getAuth();

  useEffect(() => {
    if (role !== "ROLE_ADMIN") {
      alert("권한이 없습니다.");
      nav("/notice");
      return;
    }
    http
      .get(`/notices/${id}`)
      .then((data) => {
        setTitle(data.title);
        setContent(data.content);
        setPinned(data.pinned);
        setPinOrder(data.pinOrder);
      })
      .catch((err) => {
        console.error(err);
        alert("공지 불러오기 실패");
      });
  }, [id, role, nav]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { token } = getAuth();
    try { 
      // await http.put(`/notices/${id}`, { title, content, pinned, pinOrder });
      await axios.put(`/api/notices/${id}`, { title, content, pinned, pinOrder }, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
          withCredentials: true,
        });
      alert("공지사항이 수정되었습니다.");
      nav(`/notice/${id}`);
    } catch (err) {
      alert("공지 수정 실패: " + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="notice-page">
      <div className="notice-banner">
        <img
          src="/images/NoticeBanner.png"
          alt="공지사항 배너"
          onError={(e) => (e.currentTarget.src = "/images/no-image.png")}
        />
        <div className="notice-banner-text">
          <h1>공지사항 수정</h1>
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
          <button type="submit">수정 완료</button>
          <button type="button" onClick={() => nav(`/notice/${id}`)}>
            취소
          </button>
        </div>
      </form>
    </div>
  );
}
