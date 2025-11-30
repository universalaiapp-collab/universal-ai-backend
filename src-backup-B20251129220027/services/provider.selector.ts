type Provider = 'gemini' | 'openai' | 'mock';

export function selectProvider(preferences: { allowGemini:boolean, allowOpenAI:boolean }) : Provider {
  // simple scoring: prefer Gemini if allowed, else OpenAI, else mock
  if (preferences.allowGemini) return 'gemini';
  if (preferences.allowOpenAI) return 'openai';
  return 'mock';
}
export default { selectProvider };
