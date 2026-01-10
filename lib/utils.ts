// lib/utils.ts
export function makeSlug(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 30) || 'landing';
}

export function extractJSON(text: string) {
  const fence = text.match(/```json([\s\S]*?)```/i) || text.match(/```([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) return text.slice(start, end + 1);
  return text.trim();
}

export function ensureFullHtml(html: string) {
  if (/<html[\s\S]*<\/html>/i.test(html)) return html;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Landing</title></head><body>${html}</body></html>`;
}

export function generateShortSiteName(): string {
  // Generate a short, memorable name for published websites
  // Format: prefix + random letters/numbers (total ~8-12 chars)

  const prefixes = ['site', 'page', 'land', 'web', 'hub', 'spot', 'link'];
  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const vowels = 'aeiou';
  const numbers = '0123456789';

  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];

  // Generate 2-3 random characters (mix of letters and numbers)
  let suffix = '';
  const suffixLength = 2 + Math.floor(Math.random() * 2); // 2-3 chars

  for (let i = 0; i < suffixLength; i++) {
    const charSets = [consonants, vowels, numbers];
    const charSet = charSets[Math.floor(Math.random() * charSets.length)];
    suffix += charSet[Math.floor(Math.random() * charSet.length)];
  }

  return `${prefix}-${suffix}`;
}
