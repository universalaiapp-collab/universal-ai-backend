import { openaiAdapter } from '../src/providers/openai.adapter';
import type { AdapterResponse } from '../src/types/adapter';

async function check() {
  try {
    const sample = await openaiAdapter('Hello from adapter check', { model: process.env.OPENAI_MODEL || 'gpt-4o-mini' });
    const ok = typeof sample.success === 'boolean' && typeof sample.provider === 'string' && ('data' in sample || 'error' in sample);
    console.log('Adapter check result shape OK?', ok);
    console.log(JSON.stringify(sample, null, 2));
    if (!ok) process.exit(2);
  } catch (err) {
    console.error('Adapter check failed:', err);
    process.exit(1);
  }
}
check();
