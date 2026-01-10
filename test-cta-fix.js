// Test the CTA button fix by checking the system prompt and user instructions
const fs = require('fs');
const path = require('path');

try {
  console.log('Testing CTA button fix in generate-html route...');

  // Read the generate-html route file
  const routePath = path.join(__dirname, 'app', 'api', 'generate-html', 'route.ts');
  const routeContent = fs.readFileSync(routePath, 'utf8');

  // Check if the system prompt includes the CTA button safety instructions
  const hasCtaSafetyInstruction = routeContent.includes('CTA BUTTON BEHAVIOR: The primary CTA button in the hero section should NOT cause any navigation or UI breakage');

  // Check if the user instructions include safe CTA button implementations
  const hasSafeButtonInstructions = routeContent.includes('CRITICAL: The primary CTA button in the hero section MUST be safe and not cause UI breakage');
  const hasButtonExamples = routeContent.includes('<button type="button">') && routeContent.includes('href="#" onclick="return false;"');

  console.log('✓ System prompt includes CTA safety instructions:', hasCtaSafetyInstruction);
  console.log('✓ User instructions include safe CTA requirements:', hasSafeButtonInstructions);
  console.log('✓ User instructions include safe button examples:', hasButtonExamples);

  if (hasCtaSafetyInstruction && hasSafeButtonInstructions && hasButtonExamples) {
    console.log('SUCCESS: CTA button fix has been properly implemented');
    console.log('The generated HTML should now use safe CTA buttons that won\'t break the UI');
  } else {
    console.log('ERROR: CTA button fix is incomplete');
  }

} catch (e) {
  console.log('Error:', e.message);
}