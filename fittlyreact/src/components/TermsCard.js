import React, { useEffect, useRef, useState } from "react";
import "../css/termscard.css";

export default function TermsCard({
  open,
  onClose,
  onAgree,
  defaultRequired = false,
  defaultMarketing = false,
}) {
  const [required1, setRequired1] = useState(defaultRequired);
  const [required2, setRequired2] = useState(defaultRequired);
  const [marketing, setMarketing] = useState(defaultMarketing);
  const masterRef = useRef(null);

  useEffect(() => {
    setRequired1(defaultRequired);
    setRequired2(defaultRequired);
    setMarketing(defaultMarketing);
  }, [defaultRequired, defaultMarketing, open]);

  const allRequiredChecked = required1 && required2;
  const allChecked = required1 && required2 && marketing;

  useEffect(() => {
    if (masterRef.current) {
      const anyChecked = required1 || required2 || marketing;
      masterRef.current.indeterminate = anyChecked && !allChecked;
    }
  }, [required1, required2, marketing, allChecked]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleMasterChange = (e) => {
    const v = e.target.checked;
    setRequired1(v);
    setRequired2(v);
    setMarketing(v);
  };

  const requiredCount = (required1 ? 1 : 0) + (required2 ? 1 : 0);

  return (
    <div
      className="tc-backdrop"
      role="dialog"
      aria-modal="true"
      onClick={() => onClose?.()}
    >
      <div
        className="tc-card"
        role="document"
        aria-labelledby="tc-title"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 id="tc-title" className="tc-title">약관 동의</h3>
        <div className="tc-master">
          <label className="tc-checkrow tc-master-row">
            <input
              ref={masterRef}
              type="checkbox"
              checked={allChecked}
              onChange={handleMasterChange}
              aria-label="약관 전체 동의"
            />
            <span className="tc-master-label">
              <b>약관 전체 동의</b>
              <small className="tc-master-note">필수 및 선택 항목을 모두 선택합니다.</small>
            </span>
          </label>
          <div className="tc-master-status" aria-live="polite">
            필수 {requiredCount}/2
          </div>
        </div>

        <div className="tc-scroll" role="region" aria-label="약관 내용">
          <h4 className="tc-subtitle">이용약관 (요약)</h4>
          <p className="tc-text">서비스 목적, 금지행위, 게시물 책임, 면책 및 분쟁조정 절차 등.</p>
          <label className="tc-checkrow">
            <input
              type="checkbox"
              checked={required1}
              onChange={(e) => setRequired1(e.target.checked)}
            />
            <span>이용약관에 동의합니다. <b>(필수)</b></span>
          </label>

          <hr className="tc-hr" />

          <h4 className="tc-subtitle">개인정보 처리방침 (요약)</h4>
          <p className="tc-text">수집 항목: 아이디, 이메일, 접속기록 / 보유기간: 탈퇴 후 5년 등.</p>
          <label className="tc-checkrow">
            <input
              type="checkbox"
              checked={required2}
              onChange={(e) => setRequired2(e.target.checked)}
            />
            <span>개인정보 처리방침에 동의합니다. <b>(필수)</b></span>
          </label>

          <hr className="tc-hr" />

          <h4 className="tc-subtitle">선택 동의</h4>
          <label className="tc-checkrow">
            <input
              type="checkbox"
              checked={marketing}
              onChange={(e) => setMarketing(e.target.checked)}
            />
            <span>이벤트/마케팅 정보 수신에 동의합니다. <em>(선택)</em></span>
          </label>
        </div>

        <div className="tc-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!allRequiredChecked}
            aria-disabled={!allRequiredChecked}
            onClick={() => {
              onAgree?.(allRequiredChecked, marketing);
              onClose?.();
            }}
          >
            동의 및 닫기
          </button>
        </div>
      </div>
    </div>
  );
}
