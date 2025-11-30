/**
 * Provider ordering helper.
 * Reads PROVIDER_ORDER env var like "openai,anthropic,local"
 */
export function getProviderOrder(): string[] {
  const env = process.env.PROVIDER_ORDER || "";
  if (env.trim()) {
    return env.split(",").map((s) => s.trim()).filter(Boolean);
  }
  return ["openai", "anthropic", "local"];
}

/**
 * Resolve providers list (adapterPath is a string we can later import dynamically)
 */
export async function resolveProviders(): Promise<{ name: string; adapterPath?: string }[]> {
  const order = getProviderOrder();
  return order.map((name) => ({ name, adapterPath: `./\${name}.adapter` })); // keep as template string for later runtime replacement
}
