import React, { useEffect, useState } from "react";
import { fetchRecoQuestions } from "../../api/reco";

const SS_KEY = "ai_survey_answers";

export default function RecoSurvey({ onSubmit }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState(() => {
    try {
      const s = sessionStorage.getItem(SS_KEY);
      return s ? JSON.parse(s) : { gender: "U", styles: [], budget: "MID" };
    } catch {
      return { gender: "U", styles: [], budget: "MID" };
    }
  });

  const [submitted, setSubmitted] = useState(
    () => sessionStorage.getItem("ai_survey_submitted") === "1"
  );

  useEffect(() => {
    let alive = true;
    fetchRecoQuestions().then((res) => {
      if (!alive) return;
      setQuestions(res.questions || []);
      setLoading(false);
    });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem(SS_KEY, JSON.stringify(answers));
  }, [answers]);

  const toggleStyle = (code) => {
    setAnswers((prev) => {
      const has = prev.styles.includes(code);
      return { ...prev, styles: has ? prev.styles.filter((c) => c !== code) : [...prev.styles, code] };
    });
  };

  const submitNow = () => {
    setSubmitted(true);
    sessionStorage.setItem("ai_survey_submitted", "1");
    onSubmit?.(answers);
  };

  if (loading) return <div className="p-4">설문 불러오는 중...</div>;

  return (
    <div className="reco-survey card">
      <div className="q-block">
        <div className="q-title">성별을 선택해주세요</div>
        <div className="q-options row">
          {[
            { code: "M", label: "남성" },
            { code: "F", label: "여성" },
            { code: "U", label: "선택 안 함" },
          ].map((g) => (
            <label
              key={g.code}
              className={`chip ${answers.gender === g.code ? "active" : ""}`}
              aria-pressed={answers.gender === g.code}
            >
              <input
                type="radio"
                name="gender"
                value={g.code}
                checked={answers.gender === g.code}
                onChange={() => setAnswers((p) => ({ ...p, gender: g.code }))}
              />
              {g.label}
            </label>
          ))}
        </div>
      </div>

      <div className="q-block">
        <div className="q-title">선호 스타일(복수 선택 가능)</div>
        <div className="q-options row">
          {[
            { code: "minimal", label: "미니멀" },
            { code: "street", label: "스트릿" },
            { code: "classic", label: "클래식" },
            { code: "athleisure", label: "애슬레저" },
          ].map((opt) => (
            <label
              key={opt.code}
              className={`chip ${answers.styles.includes(opt.code) ? "active" : ""}`}
              aria-pressed={answers.styles.includes(opt.code)}
            >
              <input type="checkbox" value={opt.code} onChange={() => toggleStyle(opt.code)} />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="q-block">
        <div className="q-title">예산대</div>
        <div className="q-options row">
          {[
            { code: "LOW", label: "~ 5만원" },
            { code: "MID", label: "5만 ~ 10만원" },
            { code: "HIGH", label: "10만원 이상" },
          ].map((opt) => (
            <label
              key={opt.code}
              className={`chip ${answers.budget === opt.code ? "active" : ""}`}
              aria-pressed={answers.budget === opt.code}
            >
              <input
                type="radio"
                name="budget"
                value={opt.code}
                checked={answers.budget === opt.code}
                onChange={() => setAnswers((p) => ({ ...p, budget: opt.code }))}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      <div className="action">
        <button
          className={`btn primary ${submitted ? "submitted" : ""}`}
          onClick={submitNow}
          aria-pressed={submitted}
        >
          {submitted ? "추천 갱신하기" : "추천 받기"}
        </button>
      </div>
    </div>
  );
}
