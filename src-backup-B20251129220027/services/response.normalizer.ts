export function normalizeOpenAI(raw:any) {
  return {
    outputText: raw?.choices?.[0]?.text || raw?.choices?.[0]?.message?.content || '',
    raw,
    usage: raw?.usage || {}
  };
}
export function normalizeGemini(raw:any) {
  return {
    outputText: raw?.candidates?.[0]?.content || raw?.response?.output || '',
    raw,
    usage: raw?.usage || {}
  };
}
export default { normalizeOpenAI, normalizeGemini };
