// Test script for short name generation
function generateShortSiteName() {
  // Generate a short, memorable name for published websites
  // Format: 3-5 random characters

  const consonants = 'bcdfghjklmnpqrstvwxyz';
  const vowels = 'aeiou';
  const numbers = '0123456789';

  // Generate 3-5 random characters (mix of letters and numbers)
  let name = '';
  const nameLength = 3 + Math.floor(Math.random() * 3); // 3-5 chars

  for (let i = 0; i < nameLength; i++) {
    const charSets = [consonants, vowels, numbers];
    const charSet = charSets[Math.floor(Math.random() * charSets.length)];
    name += charSet[Math.floor(Math.random() * charSet.length)];
  }

  return name;
}

console.log('Testing short name generation:');
console.log('Generated names:');
for(let i = 0; i < 15; i++) {
  const name = generateShortSiteName();
  console.log(`  ${name} (${name.length} chars)`);
}