import React from "react";
import "../css/ReviewNotice.css";

export default function ReviewNotice({ onClose }) {
  return (
    <div className="notice-overlay" onClick={onClose}>
      <div
        className="notice-box show"
        onClick={(e) => e.stopPropagation()}
      >
        <button className="notice-close" onClick={onClose}>
          &times;
        </button>

        <h2>작성 시 유의사항</h2>

        <div className="notice-content">
          <h3>유의사항</h3>
          <ul>
            <li>작성하신 후기는 FITTLY 이용자에게 공개됩니다.</li>
          </ul>

          <h3>후기 도용 방지 정책</h3>
          <ul>
            <li>사진 도용 시 일부 FITTLY 서비스 이용이 제한될 수 있습니다.</li>
          </ul>

          <h3>동의사항</h3>
          <ul>
            <li>신체정보는 후기 서비스 목적에만 사용되며, FITTLY 개인정보 처리방침에 따라 안전하게 관리됩니다.</li>
          </ul>
        </div>

        <button className="rc-submit" onClick={onClose}>
          확인
        </button>
      </div>
    </div>
  );
}