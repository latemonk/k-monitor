// api/mcp/utils.ts
function utf8ByteLength(s) {
  return new TextEncoder().encode(s).length;
}
function compressDescription(text, maxBytes) {
  if (typeof text !== "string" || text.length === 0) return text;
  if (utf8ByteLength(text) <= maxBytes) return text;
  const sentenceMatch = text.match(/^[\s\S]+?[.!?](?:\s|$)/);
  const candidate = sentenceMatch ? sentenceMatch[0].trim() : text;
  if (utf8ByteLength(candidate) <= maxBytes) return candidate;
  const encoder = new TextEncoder();
  let out = "";
  let used = 0;
  for (const ch of candidate) {
    const chBytes = encoder.encode(ch).length;
    if (used + chBytes > maxBytes) break;
    out += ch;
    used += chBytes;
  }
  return out;
}
export {
  compressDescription,
  utf8ByteLength
};
