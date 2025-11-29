export function normalizePrompt(text: string, type: string) {
  // Basic normalization: trim, collapse whitespace, remove weird control chars
  let t = (text || '').replace(/\s+/g, ' ').trim();
  // add a system prefix for chat type
  if (type === 'chat' && !/^user:/i.test(t)) {
    t = `user: ${t}`;
  }
  return t;
}

export default { normalizePrompt };
