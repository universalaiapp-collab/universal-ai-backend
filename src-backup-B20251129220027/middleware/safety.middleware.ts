// Safety middleware: simple jailbreak & provider guardrail checks
// Extend with advanced logic as needed.

const JAILBREAK_PATTERNS = [
  /ignore (previous )?instructions/i,
  /bypass (filters|moderation)/i,
  /give me (the )?raw/i,
];

export const checkJailbreak = (text: string) => {
  const low = text.toLowerCase();
  return JAILBREAK_PATTERNS.some((r) => r.test(low));
};

export const toxicityFilter = (text: string) => {
  // re-use moderation checks or advanced checks
  return false;
};

export const requestSafetyGuard = (req: any, res: any, next: any) => {
  const prompt = (req.body && req.body.prompt) || '';
  if (checkJailbreak(prompt)) {
    return res.status(422).json({ ok: false, error: 'Safety block: possible jailbreak attempt' });
  }
  // provider guardrails example: disallow system-level instructions
  if (/act as an admin|expose secret|private key/i.test(prompt)) {
    return res.status(422).json({ ok: false, error: 'Safety block: forbidden instruction' });
  }
  return next();
};

export default { requestSafetyGuard, checkJailbreak, toxicityFilter };
