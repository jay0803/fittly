const TAG_RE = /(^|[^0-9A-Za-z_\u3131-\uD79D])#([A-Za-z0-9_\u3131-\uD79D][A-Za-z0-9_\-\u3131-\uD79D]{0,49})/g;

export function tokenizeHashtags(text = "") {
  if (!text) return [{ type: "text", value: "" }];

  const out = [];
  let lastIndex = 0;

  text.replace(TAG_RE, (match, prefixChar, tag, offset) => {

    if (text[offset + prefixChar.length + 1] === "#") return match;
    if (offset > lastIndex) {
      out.push({ type: "text", value: text.slice(lastIndex, offset) });
    }

    if (prefixChar) out.push({ type: "text", value: prefixChar });

    out.push({ type: "tag", value: tag });
    lastIndex = offset + match.length;
    return match;
  });

  if (lastIndex < text.length) {
    out.push({ type: "text", value: text.slice(lastIndex) });
  }
  return out;
}

export function extractHashtags(text = "") {
  return tokenizeHashtags(text)
    .filter(t => t.type === "tag")
    .map(t => t.value);
}
