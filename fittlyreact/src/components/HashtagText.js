import React from "react";
import { Link } from "react-router-dom";
import { tokenizeHashtags } from "../utils/mdLinkifyHashtags";

export default function HashtagText({
  text = "",
  to = "/search",
  param = "tag",
  className = "",
  onTagClick,
}) {
  const tokens = tokenizeHashtags(text);

  return (
    <div className={className} style={{ whiteSpace: "pre-wrap" }}>
      {tokens.map((t, i) => {
        if (t.type === "tag") {
          const href = `${to}?${encodeURIComponent(param)}=${encodeURIComponent(t.value)}`;
          const el = (
            <span className="hash-pill">#{t.value}</span>
          );
          return onTagClick ? (
            <button
              key={`tag-${i}`}
              type="button"
              className="hash-link"
              onClick={() => onTagClick(t.value)}
              aria-label={`태그 ${t.value}로 검색`}
            >
              {el}
            </button>
          ) : (
            <Link key={`tag-${i}`} to={href} className="hash-link" aria-label={`태그 ${t.value}로 검색`}>
              {el}
            </Link>
          );
        }
        return <React.Fragment key={`txt-${i}`}>{t.value}</React.Fragment>;
      })}
    </div>
  );
}
