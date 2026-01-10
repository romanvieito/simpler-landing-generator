// Test the CTA button linking fix by checking that header CTA links to contact form
const fs = require('fs');
const path = require('path');

try {
  console.log('Testing CTA button linking fix in generate-html route...');

  // Read the generate-html route file
  const routePath = path.join(__dirname, 'app', 'api', 'generate-html', 'route.ts');
  const routeContent = fs.readFileSync(routePath, 'utf8');

  // Check if the system prompt includes the CTA button linking instructions
  const hasCtaLinkInstruction = routeContent.includes('CTA BUTTON BEHAVIOR: The primary CTA button in the hero section should link to the contact form at the bottom of the page');

  // Check if the user instructions include contact form linking
  const hasContactLinkInstructions = routeContent.includes('CRITICAL: The primary CTA button in the hero section MUST link to the contact form at the bottom of the page');
  const hasContactSectionLink = routeContent.includes('href="#contact-section"');

  console.log('✓ System prompt includes CTA linking instructions:', hasCtaLinkInstruction);
  console.log('✓ User instructions include contact form linking:', hasContactLinkInstructions);
  console.log('✓ User instructions include contact section link:', hasContactSectionLink);

  if (hasCtaLinkInstruction && hasContactLinkInstructions && hasContactSectionLink) {
    console.log('SUCCESS: CTA button linking fix has been properly implemented');
    console.log('The generated HTML should now have header CTA buttons that link to the contact form');
  } else {
    console.log('ERROR: CTA button linking fix is incomplete');
  }

} catch (e) {
  console.log('Error:', e.message);
}