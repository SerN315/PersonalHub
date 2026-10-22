// A widget's saved data as a plain object, whatever came back. Older saves left it as one long piece of text, and spreading text
// (`{ ...data }`) turns every character into its own entry, which then got saved and grew with each save. Text is parsed back into
// the object it holds; the one-entry-per-character shape is stripped to the real keys beside it.
export function asRecord(value: unknown): Record<string, unknown> {
  let current: unknown = value;
  for (let i = 0; i < 12; i++) {
    if (typeof current === "string") {
      try {
        current = JSON.parse(current);
      } catch {
        return {};
      }
    } else if (current && typeof current === "object" && !Array.isArray(current)) {
      const entries = Object.entries(current as Record<string, unknown>);
      return "0" in (current as object) ? Object.fromEntries(entries.filter(([key]) => !/^\d+$/.test(key))) : (current as Record<string, unknown>);
    } else {
      return {};
    }
  }
  return {};
}
