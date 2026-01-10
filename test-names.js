// Test script for short name generation
function generateShortSiteName() {
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

console.log('Testing short name generation:');
console.log('Generated names:');
for(let i = 0; i < 15; i++) {
  const name = generateShortSiteName();
  console.log(`  ${name} (${name.length} chars)`);
}