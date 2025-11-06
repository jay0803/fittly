import React, { useMemo, useState, useEffect } from "react";
import "../css/ReviewFilters.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

export default function ReviewFilters({ colors = [], sizes = [], onFilterChange }) {
  const buttons = useMemo(
    () => [
      { key: "filter", label: <i className="fas fa-sliders"></i>, isIcon: true },
      { key: "남", label: "남" },
      { key: "여", label: "여" },
      { key: "색상", label: "색상▾" },
      { key: "사이즈", label: "사이즈▾" },
      { key: "키/몸무게", label: "키/몸무게▾" },
    ],
    []
  );

  const [selected, setSelected] = useState(new Set());
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("성별");
  const [modalState, setModalState] = useState({
    색상: new Set(),
    사이즈: new Set(),
    성별: new Set(),
  });

  const [heightRange, setHeightRange] = useState({ min: "", max: "" });
  const [weightRange, setWeightRange] = useState({ min: "", max: "" });
  const syncFilterChange = (nextSet) => {
    if (!onFilterChange) return;
    const arr = Array.from(nextSet);
    const filters = {
      gender: arr.filter((x) => ["남성", "여성"].includes(x)),
      colors: arr.filter((x) => colors.includes(x)),
      sizes: arr.filter((x) => sizes.includes(x) || /^[0-9]+$/.test(x)),
      heightRange: (() => {
        const found = arr.find((x) => x.startsWith("키:"));
        if (!found) return null;
        const [min, max] = found.replace("키:", "").split("-").map((n) => n.trim());
        return { min: Number(min), max: Number(max) };
      })(),
      weightRange: (() => {
        const found = arr.find((x) => x.startsWith("몸무게:"));
        if (!found) return null;
        const [min, max] = found.replace("몸무게:", "").split("-").map((n) => n.trim());
        return { min: Number(min), max: Number(max) };
      })(),
    };

    onFilterChange(filters);
  };

  const toggleGenderChip = (who) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const label = who === "남" ? "남성" : "여성";
      next.has(label) ? next.delete(label) : next.add(label);
      syncFilterChange(next);
      return next;
    });
  };

  const handleClick = (key) => {
    if (key === "filter") return setOpen(true);
    if (key === "남" || key === "여") return toggleGenderChip(key);
    if (["색상", "사이즈", "키/몸무게"].includes(key)) {
      setActiveTab(key);
      setOpen(true);
    }
  };

  const removeOne = (label) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(label);

      setModalState((ms) => {
        const updated = { ...ms };
        Object.keys(updated).forEach((k) => {
          updated[k] = new Set([...updated[k]].filter((v) => v !== label));
        });
        return updated;
      });

      syncFilterChange(next);
      return next;
    });
  };

  const resetAll = () => {
    setSelected(new Set());
    setModalState({ 색상: new Set(), 사이즈: new Set(), 성별: new Set() });
    setHeightRange({ min: "", max: "" });
    setWeightRange({ min: "", max: "" });
    syncFilterChange(new Set());
  };

  const modalToggle = (tab, item) => {
    setModalState((prev) => {
      const next = { ...prev };
      const s = new Set(next[tab] || []);
      s.has(item) ? s.delete(item) : s.add(item);
      next[tab] = s;
      return next;
    });
  };

  const applyModal = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      modalState["사이즈"]?.forEach((x) => next.add(x));
      modalState["색상"]?.forEach((x) => next.add(x));
      modalState["성별"]?.forEach((x) => next.add(x));
      syncFilterChange(next);
      return next;
    });
    setOpen(false);
  };

  const applyHeight = () => {
    if (!heightRange.min || !heightRange.max) return;
    const label = `키:${heightRange.min}-${heightRange.max}`;
    setSelected((prev) => {
      const next = new Set(prev).add(label);
      syncFilterChange(next);
      return next;
    });
  };

  const applyWeight = () => {
    if (!weightRange.min || !weightRange.max) return;
    const label = `몸무게:${weightRange.min}-${weightRange.max}`;
    setSelected((prev) => {
      const next = new Set(prev).add(label);
      syncFilterChange(next);
      return next;
    });
  };

  useEffect(() => {
    syncFilterChange(selected);
  }, [selected]);

  const chips = Array.from(selected);
  const tabs = ["성별", "색상", "사이즈", "키/몸무게"];
  const sizeOptions = sizes.length > 0 ? sizes : ["XS", "S", "M", "L"];
  const colorOptions = colors.length > 0 ? colors : ["블랙", "화이트", "그레이"];
  const genderOptions = ["남성", "여성"];
  const renderModalBody = () => {
    switch (activeTab) {
      case "성별":
        return (
          <div className="rf-modal-grid">
            {genderOptions.map((it) => (
              <label key={it} className="rf-check">
                <input
                  type="checkbox"
                  checked={modalState["성별"]?.has(it) || false}
                  onChange={() => modalToggle("성별", it)}
                />
                <span>{it}</span>
              </label>
            ))}
          </div>
        );
      case "색상":
        return (
          <div className="rf-modal-grid">
            {colorOptions.map((c) => (
              <label key={c} className="rf-check">
                <input
                  type="checkbox"
                  checked={modalState["색상"]?.has(c) || false}
                  onChange={() => modalToggle("색상", c)}
                />
                <span>{c}</span>
              </label>
            ))}
          </div>
        );
      case "사이즈":
        return (
          <div className="rf-modal-grid">
            {sizeOptions.map((it) => (
              <label key={it} className="rf-check">
                <input
                  type="checkbox"
                  checked={modalState["사이즈"]?.has(it) || false}
                  onChange={() => modalToggle("사이즈", it)}
                />
                <span>{it}</span>
              </label>
            ))}
          </div>
        );
      case "키/몸무게":
        return (
          <div className="rf-input-group">
            <div className="rf-input-row">
              <label className="rf-label">키(cm)</label>
              <input
                type="number"
                value={heightRange.min}
                placeholder="최소"
                onChange={(e) =>
                  setHeightRange({ ...heightRange, min: e.target.value })
                }
              />
              <span>-</span>
              <input
                type="number"
                value={heightRange.max}
                placeholder="최대"
                onChange={(e) =>
                  setHeightRange({ ...heightRange, max: e.target.value })
                }
              />
              <button className="rf-apply-btn-mini" onClick={applyHeight}>
                적용
              </button>
            </div>
            <div className="rf-input-row">
              <label className="rf-label">몸무게(kg)</label>
              <input
                type="number"
                value={weightRange.min}
                placeholder="최소"
                onChange={(e) =>
                  setWeightRange({ ...weightRange, min: e.target.value })
                }
              />
              <span>-</span>
              <input
                type="number"
                value={weightRange.max}
                placeholder="최대"
                onChange={(e) =>
                  setWeightRange({ ...weightRange, max: e.target.value })
                }
              />
              <button className="rf-apply-btn-mini" onClick={applyWeight}>
                적용
              </button>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="rf-wrap">
      <div className="rf-row">
        {buttons.map((b) => (
          <button
            key={b.key}
            type="button"
            className={`rf-btn ${b.isIcon ? "filter-btn" : ""}`}
            onClick={() => handleClick(b.key)}
          >
            {b.label}
          </button>
        ))}
      </div>

      <div className="rf-selected">
        <div className="rf-chip-area">
          {chips.length === 0 ? (
            <span className="rf-placeholder">선택된 필터 없음</span>
          ) : (
            chips.map((k, i) => (
              <React.Fragment key={k}>
                <span className="rf-chip">
                  {k}
                  <button
                    type="button"
                    className="rf-chip-x"
                    onClick={() => removeOne(k)}
                  >
                    ×
                  </button>
                </span>
                {i < chips.length - 1 && <span>,</span>}
              </React.Fragment>
            ))
          )}
        </div>
        {chips.length > 0 && (
          <button type="button" className="rf-reset" onClick={resetAll}>
            초기화
          </button>
        )}
      </div>

      <div className="rf-divider" />

      {open && (
        <div className="rf-modal-overlay" onClick={() => setOpen(false)}>
          <div
            className="rf-modal"
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="rf-modal-header">
              <div className="rf-modal-title">필터</div>
              <button className="rf-modal-close" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <div className="rf-modal-tabs">
              {tabs.map((t) => (
                <button
                  key={t}
                  className={`rf-modal-tab ${activeTab === t ? "active" : ""}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>

            <div className="rf-modal-sep" />
            <div className="rf-modal-body">{renderModalBody()}</div>

            <div className="rf-modal-footer">
              <button className="rf-apply-btn" onClick={applyModal}>
                후기 보기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
