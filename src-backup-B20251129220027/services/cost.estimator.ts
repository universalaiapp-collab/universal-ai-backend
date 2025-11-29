export function estimateCost(provider:string, tokens:number){
  const rate = provider === 'openai' ? (process.env.OPENAI_COST_PER_TOKEN || 0.00002) : (process.env.GEMINI_COST_PER_TOKEN || 0.00002);
  return Number(tokens) * Number(rate);
}
export default { estimateCost };